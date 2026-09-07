FROM node:24-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code
RUN pip3 install --no-cache-dir --break-system-packages fastapi "uvicorn[standard]"
WORKDIR /app
COPY server.py .

# Three credentials can reach this container. server.py picks between them in
# `credential_env()` and reports the winner at /health, so the choice is never
# left to the CLI's own precedence.
#
#   ANTHROPIC_API_KEY        A real API key. Billed, uncapped, and the only one
#                            whose terms cover serving other people. Preferred
#                            whenever it is present.
#   CLAUDE_CODE_OAUTH_TOKEN  A long-lived subscription token from
#                            `claude setup-token`. Needs no interactive login
#                            and no files from a laptop, so this is the one that
#                            makes a deployed host work — but it spends one
#                            person's subscription quota, which is sized for one
#                            person.
#   /root/.claude            A mounted personal login. Local only: there is no
#                            host home directory to mount on Railway, and on
#                            macOS the credential lives in the Keychain rather
#                            than in that directory, so mounting it carries
#                            nothing.
#
# Deliberately NOT declared with ENV here: baking a credential name into the
# image is what Docker's SecretsUsedInArgOrEnv warning is about, and the value
# has to come from the runtime anyway (Railway variables, or `-e` locally).
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
