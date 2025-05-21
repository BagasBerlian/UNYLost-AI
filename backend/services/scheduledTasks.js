const syncService = require("./syncService");
const cron = require("node-cron");

exports.startSyncJobs = () => {
  console.log("Starting scheduled sync jobs...");

  cron.schedule("*/30 * * * *", async () => {
    console.log("Running scheduled lost items sync...");
    try {
      const result = await syncService.syncLostItemsToFirestore(20);
      console.log(
        `Scheduled sync completed: ${result.synchronized} success, ${result.failed} failed`
      );
    } catch (error) {
      console.error("Error in scheduled sync job:", error);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily data integrity check...");
    try {
      // Implementasi pemeriksaan integritas data
      // ...
    } catch (error) {
      console.error("Error in data integrity check:", error);
    }
  });
};
