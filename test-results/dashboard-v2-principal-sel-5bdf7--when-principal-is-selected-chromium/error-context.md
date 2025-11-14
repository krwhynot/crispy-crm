# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e7]:
      - img "MFB Master Food Brokers" [ref=e8]
      - text: MFB Master Food Brokers
    - generic [ref=e10]:
      - heading "Sign in" [level=1] [ref=e12]
      - generic [ref=e13]:
        - group [ref=e14]:
          - generic [ref=e16]: Email *
          - textbox "Email *" [ref=e17]
          - generic [ref=e18]: Required
        - group [ref=e19]:
          - generic [ref=e21]: Password *
          - textbox "Password *" [ref=e22]
          - generic [ref=e23]: Required
        - button "Sign in" [ref=e24] [cursor=pointer]
      - link "Forgot your password?" [ref=e25] [cursor=pointer]:
        - /url: "#/forgot-password"
  - region "Notifications alt+T"
```