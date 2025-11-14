# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "Sign in" [level=1] [ref=e8]
    - generic [ref=e9]:
      - group [ref=e10]:
        - generic [ref=e12]: Email *
        - textbox "Email *" [ref=e13]
        - generic [ref=e14]: Required
      - group [ref=e15]:
        - generic [ref=e17]: Password *
        - textbox "Password *" [ref=e18]
        - generic [ref=e19]: Required
      - button "Sign in" [ref=e20] [cursor=pointer]
    - link "Forgot your password?" [ref=e21] [cursor=pointer]:
      - /url: "#/forgot-password"
  - region "Notifications alt+T"
```