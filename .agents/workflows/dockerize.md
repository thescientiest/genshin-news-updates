---
description: Scaffolds optimized multi-stage Dockerfiles and container-compose setups.
---

# Containerization Playbook

1. **Inspect Workspace:**
   - Analyze dependencies, lockfiles, runtime version, and port configurations.

2. **Generate Container Configs:**
   - Write a multi-stage `Dockerfile` optimizing build cache layers and keeping runtime base images minimal (e.g., distroless or alpine).
   - Ensure the container runs as an unprivileged non-root user.
   - Provide a `.dockerignore` file excluding `.git`, local environment files (`.env`), cache folders, and test artifacts.

3. **Verify Build:**
   - Run `docker build -t app:test .` in the terminal to verify the image compiles cleanly.