# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - banner [ref=e6]:
        - generic [ref=e7]:
          - link "SINA IQ" [ref=e9] [cursor=pointer]:
            - /url: /
            - text: SINAIQ
          - generic [ref=e12]:
            - button "Content" [ref=e14] [cursor=pointer]:
              - img [ref=e16]
              - generic: Content
            - button "Pictures" [ref=e20] [cursor=pointer]:
              - img [ref=e22]
              - generic: Pictures
            - button "Video" [ref=e28] [cursor=pointer]:
              - img [ref=e30]
              - generic: Video
          - generic [ref=e33]:
            - button "GENERATE" [disabled] [ref=e35]:
              - img [ref=e37]
              - generic: GENERATE
            - button "Account & Settings" [ref=e46] [cursor=pointer]:
              - generic [ref=e47]: U
              - generic: User
              - img [ref=e48]
    - main [ref=e50]:
      - generic [ref=e53]:
        - button "Open BADU Assistant" [ref=e55]:
          - img [ref=e59]
        - generic:
          - generic:
            - generic:
              - generic: BADU Assistant
  - dialog "panel":
    - contentinfo
```