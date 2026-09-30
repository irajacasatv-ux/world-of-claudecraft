/** The exact Install Chromium run block both browser jobs must carry
 *  (ci.yml browser-gate and nightly.yml browser), pinned as one block scalar
 *  so a step comment cannot satisfy the pin, the hard-failing browser install
 *  cannot grow a fallback, and the bounded degraded path cannot drift
 *  silently. The shape: the browser install fails hard; install-deps gets
 *  one bounded try; on failure the step verifies the CAPABILITY the suite
 *  demonstrably needs (CJK font coverage, run 32233898992's zero-ink
 *  sprites), retries a targeted font install off the primary archive mirror,
 *  and fails loudly, still inside the auto-rerunnable setup class, only when
 *  no route produced the fonts. The fallback first stops an install-deps
 *  apt-get that outlived its timeout (it holds the dpkg lock) and waits for
 *  the lock inside its own bounds. Ruling and sizing: the step comment in
 *  ci.yml and the 2026-08-19 merge-queue rejections it cites. */
export const PLAYWRIGHT_INSTALL_BLOCK = [
  'run: |',
  '          npx playwright install chromium',
  '          if ! timeout -k 15 100 npx playwright install-deps chromium; then',
  '            echo "install-deps unavailable (exit $?); verifying CJK font coverage directly"',
  '            if ! fc-list :lang=ja | grep -q .; then',
  '              sudo pkill -x apt-get || true',
  '            ' +
    "  sudo sed -i 's|azure.archive.ubuntu.com|archive.ubuntu.com|g' /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list 2>/dev/null || true",
  '              timeout -k 15 60 sudo apt-get -o DPkg::Lock::Timeout=45 update || true',
  '              timeout -k 15 90 sudo apt-get -o DPkg::Lock::Timeout=45 install -y --no-install-recommends fonts-noto-cjk || true',
  '            fi',
  '            fc-list :lang=ja | grep -q . || { echo "no CJK font coverage by any route; the browser suite cannot pass without it"; exit 1; }',
  '          fi',
].join('\n');
