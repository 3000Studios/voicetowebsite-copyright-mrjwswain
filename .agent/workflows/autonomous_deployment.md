---
description: Fully automate the project build, verify, and deploy pipeline
---

This workflow automates the entire deployment process.
It performs the following steps:

1.  **Format & Lint**: Ensures code quality.
2.  **Smash UI Unification**: Applies the design system to all HTML files.
3.  **Verify**: Runs tests and type checks.
4.  **Version Control**: Commits all changes with a timestamp.
5.  **Push**: Pushes changes to the remote repository.
6.  **Deploy**: Deploys the application to production (Cloudflare Pages).

To run this workflow, execute the following command in your terminal:

```powershell
.\automate_all.ps1
```

// turbo
.\automate_all.ps1
