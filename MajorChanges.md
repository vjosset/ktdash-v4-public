# Major Changes

KTDash v4 is a complete rewrite of the original KTDash.app application. There were data model changes, a brand new tech stack, and new features and improvements.

## Improvements

- Updated UI
  - The mobile UI is much closer to best practices for mobile applications, with the navigation at the bottom of the screen.
- Removed the dashboard
  - All dashboard actions (orders, wounds, activations) occur on your roster page now. This is much cleaner and helps new users get started. Many users were building rosters but not realizing that the Dashboard is where they could track op orders, activation, and wounds.
- Performance improvements
  - The new tech stack makes page transitions and UI interactions much faster.
- Replaced HTML content with Markdown
  - Abilities, unique actions, weapon rules, faction and killteam descriptions, killteam composition, etc.
  - Markdown makes it much easier to maintain this content and adds a level of security to the application.
- Updated tech stack and easier contribution
  - The application is a Next.js application, and the source code has been retooled to make it much easier for people to contribute to the project. The repo is now self-contained (except for the MySQL DB) including seeding scripts etc.

## Breaking Changes

- Only supports KT24
  - KT21 killteams and rosters are not supported
- Only supports official teams
  - Homebrew teams are a nice feature for players who like them, but the work required to maintain them is not justified by the number of players who actually use them (less than 0.5% of all players in the previous version)
