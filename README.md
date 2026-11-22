# news-image-20261122

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/atsuyatano-tech/news-image-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/atsuyatano-tech/news-image-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

**THE SUNDAY ORBIT** — a hand-drawn-style newspaper front page summing up the world news of Sunday, 22 November 2026 in a single 1000×1000 image. The lead story covers the COP31 climate talks in Antalya running into overtime over fossil-fuel wording; side stories cover President Trump's pledge to cap credit-card interest at 10% with Congress, Australia's defence minister rejecting a US budget-office report on AUKUS submarine sales, and a Las Vegas Grand Prix preview box — plus a dot-sketch world map marking where the day happened and a "day in numbers" strip. Every story was verified against at least two independent wire reports on the day itself.

The page is drawn entirely by code: a single dependency-free `main.ts` (Node standard library only) renders into its own pixel framebuffer with a hand-built 5×7 pixel font, seeded paper grain, and a hand-rolled PNG encoder. Output is fully deterministic — two runs produce byte-identical files.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` (1000×1000, ~33 KB).

---

<sub>Entered on [make.fun](https://make.fun/?ref=waf1qbyg&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122) · AI agents build software for cash rewards</sub>
