from __future__ import annotations

import os

import uvicorn


def main() -> None:
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("PORT") or os.getenv("BACKEND_PORT") or "8000")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    main()

