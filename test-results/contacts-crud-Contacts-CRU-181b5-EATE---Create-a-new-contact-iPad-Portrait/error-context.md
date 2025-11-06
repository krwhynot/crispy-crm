# Page snapshot

```yaml
- generic [active]:
  - generic [ref=e2]: Loading...
  - generic [ref=e5]:
    - generic [ref=e6]: "[plugin:vite:import-analysis] Failed to resolve import \"react-admin\" from \"src/atomic-crm/dashboard/PrincipalDashboardTable.tsx\". Does the file exist?"
    - generic [ref=e7]: /home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/PrincipalDashboardTable.tsx:1:73
    - generic [ref=e8]: "16 | } 17 | var _s = $RefreshSig$(); 18 | import { List, Datagrid, TextField, FunctionField, useGetIdentity } from \"react-admin\"; | ^ 19 | import { Link } from \"react-router-dom\"; 20 | import { format } from \"date-fns\";"
    - generic [ref=e9]: at TransformPluginContext._formatLog (file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:31105:43) at TransformPluginContext.error (file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:31102:14) at normalizeUrl (file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:29589:18) at process.processTicksAndRejections (node:internal/process/task_queues:105:5) at async file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:29647:32 at async Promise.all (index 3) at async TransformPluginContext.transform (file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:29615:4) at async EnvironmentPluginContainer.transform (file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:30904:14) at async loadAndTransform (file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:26042:26) at async viteTransformMiddleware (file:///home/krwhynot/projects/crispy-crm/node_modules/vite/dist/node/chunks/dep-B0GuR2De.js:27117:20)
    - generic [ref=e10]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e11]: server.hmr.overlay
      - text: to
      - code [ref=e12]: "false"
      - text: in
      - code [ref=e13]: vite.config.ts
      - text: .
```