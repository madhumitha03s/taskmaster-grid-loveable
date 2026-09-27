# TaskGrid portfolio polish

## Scope
- Add one shared authenticated header with the TaskGrid name, List and Dashboard navigation, and logout.
- Add polished loading and empty states with a direct “Add assignment” action.
- Add course and status filters plus due-date sorting to the assignment list.
- Flag overdue, unfinished assignments consistently in the list and dashboard.
- Rework the assignment list into a mobile-friendly card layout while retaining the desktop table.
- Improve chart and timeline behavior on narrow screens without changing their calculations.
- Verify signed-in desktop and mobile flows, then run a security check and publish.

## Technical details
- Keep the current database tables, authentication checks, assignment mutations, shared query, and workload calculations unchanged.
- Use existing design tokens and controls; add only presentation components and local view state.
- Preserve each page’s current metadata and add missing social metadata fields if needed.
