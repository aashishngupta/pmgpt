dev:
	@echo "Starting pmGPT — backend on :8000, frontend on :3000"
	@trap 'kill 0' EXIT; \
	cd backend && uvicorn main:app --reload --port 8000 & \
	cd onboarding && npm run dev & \
	wait

backend:
	cd backend && uvicorn main:app --reload --port 8000

frontend:
	cd onboarding && npm run dev

.PHONY: dev backend frontend
