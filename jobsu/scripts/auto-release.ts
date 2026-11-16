// Releases payment for bookings 7+ days past their job date. Run daily: `npm run auto-release`.
import "dotenv/config";

async function main() {
  const { runAutoRelease } = await import("../src/lib/bookings");
  const released = await runAutoRelease();
  console.log(`Released ${released.length} booking(s).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
