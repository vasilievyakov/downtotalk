import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users, circles, circleMemberships } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateInviteCode } from "@/lib/crypto";

async function ensureDefaultCircle(userId: string, userName?: string | null): Promise<string> {
  // Check first (fast path)
  const existing = await db.query.circles.findFirst({
    where: eq(circles.ownerId, userId),
  });
  if (existing) return existing.id;

  const circleName = userName ? `${userName}'s circle` : "My circle";

  try {
    const [circle] = await db
      .insert(circles)
      .values({
        ownerId: userId,
        name: circleName,
        inviteCode: generateInviteCode(),
      })
      .returning();

    // Owner is also a member of their own circle
    await db
      .insert(circleMemberships)
      .values({ circleId: circle.id, userId })
      .onConflictDoNothing();

    return circle.id;
  } catch {
    // Race condition: another request created the circle — fetch it
    const created = await db.query.circles.findFirst({
      where: eq(circles.ownerId, userId),
    });
    return created!.id;
  }
}

async function importGitHubSocialGraph(
  userId: string,
  githubUsername: string,
  accessToken: string
) {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    };

    const [followingRes, followersRes] = await Promise.all([
      fetch("https://api.github.com/user/following?per_page=100", { headers }),
      fetch("https://api.github.com/user/followers?per_page=100", { headers }),
    ]);

    const following = followingRes.ok ? await followingRes.json() : [];
    const followers = followersRes.ok ? await followersRes.json() : [];

    // Collect unique GitHub usernames
    const ghUsernames = new Set<string>();
    for (const u of [...following, ...followers]) {
      if (u.login && u.login !== githubUsername) {
        ghUsernames.add(u.login.toLowerCase());
      }
    }

    if (ghUsernames.size === 0) return;

    // Find matching DownToTalk users (targeted query, not full table scan)
    const matchedUsers = await db.query.users.findMany({
      where: inArray(users.githubUsername, [...ghUsernames]),
      columns: { id: true, githubUsername: true },
    });

    if (matchedUsers.length === 0) return;

    // Get default circles for both parties
    const myCircleId = await ensureDefaultCircle(userId);

    for (const matched of matchedUsers) {
      const theirCircleId = await ensureDefaultCircle(matched.id);

      // Add them to my circle
      await db
        .insert(circleMemberships)
        .values({ circleId: myCircleId, userId: matched.id })
        .onConflictDoNothing();

      // Add me to their circle
      await db
        .insert(circleMemberships)
        .values({ circleId: theirCircleId, userId })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error("Failed to import GitHub social graph:", error instanceof Error ? error.message : "unknown error");
  }
}

const providers = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, profile, account }) {
      if (!user.email) return false;

      const existing = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      const githubUsername =
        (profile as Record<string, unknown>)?.login as string || null;

      if (!existing) {
        const [newUser] = await db
          .insert(users)
          .values({
            email: user.email,
            name: user.name || profile?.name || null,
            image: user.image || null,
            githubUsername,
            // Don't store GitHub token — use it only during sign-in
          })
          .returning();

        // Create default circle for new user
        await ensureDefaultCircle(newUser.id, newUser.name);

        // Import GitHub social graph for new users (use token in-flight, don't persist)
        if (
          account?.provider === "github" &&
          account.access_token &&
          githubUsername
        ) {
          importGitHubSocialGraph(
            newUser.id,
            githubUsername,
            account.access_token
          ).catch(() => {});
        }
      } else {
        // Update GitHub username on existing user if signing in via GitHub
        if (account?.provider === "github") {
          if (githubUsername) {
            await db
              .update(users)
              .set({ githubUsername })
              .where(eq(users.id, existing.id));
          }

          // Re-import social graph on each GitHub login (use token in-flight)
          if (account.access_token && githubUsername) {
            importGitHubSocialGraph(
              existing.id,
              githubUsername,
              account.access_token
            ).catch(() => {});
          }
        }

        // Ensure default circle exists for existing users
        await ensureDefaultCircle(existing.id, existing.name);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });
        if (dbUser) {
          token.userId = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
