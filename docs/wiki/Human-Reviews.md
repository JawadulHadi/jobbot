# Human Reviews

## Purpose
Some agent executions suspend for human input. Jobbot provides a review queue UI and proxy APIs to inspect and resume suspended executions.

## Routes & APIs
- UI: `/reviews`
- List: `GET /api/reviews`
- Resume: `POST /api/reviews/[executionId]/resume`

## Resume modes
- **Decision reviews:** submit allowed decision (e.g. approve/reject) and optional reviewer notes.
- **Interrupt reviews:** submit `resume_map` for pending interrupt IDs as required by the execution context.

## UX behavior
- Displays pending/suspended items with relevant context and timestamps.
- Visibility-aware polling/refresh to keep queue current without unnecessary background work.
- Clear status/helper copy; submission feedback and links back to resumed conversation/session where applicable.

## Operational notes
- Ensure backend/Agent Engine is configured (`MONGODB_AGENTIC_API_URL` and credentials as needed).
- Request IDs (`X-Request-Id`) aid debugging without exposing sensitive data.
- Access control: reviews are sensitive workflow actions—require proper authz before public/live exposure.
