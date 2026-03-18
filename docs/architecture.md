# Architecture

```mermaid
graph LR
    A[User hits limit] -->|One tap| B[DownToTalk API]
    B -->|Save event| C[(Neon DB)]
    B -->|Fire & forget| D[Telegram Bot]
    D -->|Inline keyboard| E[Circle members]
    E -->|Tap button| F[Direct call/chat]

    G[UptimeRobot] -->|Every 5 min| H[/api/status]
    H -->|RSS/JSON| I[Claude/OpenAI/Gemini]
    H -->|Status changed?| D
```
