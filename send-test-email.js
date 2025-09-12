const { sendMatterOpeningFailure } = require('./server/utils/emailNotifications');

// Test data similar to what would be sent in a real matter opening attempt
const testFormData = {
  formData: {
    matter_details: {
      instruction_ref: "TEST-EMAIL-123",
      client_type: "Individual", 
      practice_area: "Contract Dispute",
      description: "Test email notification"
    },
    client_information: [
      {
        first_name: "Test",
        last_name: "Client", 
        email: "test@example.com"
      }
    ]
  },
  initials: "TEST"
};

const testError = new Error("Manual test email notification");

console.log("🧪 Sending test email notification...");

// Send the test email
sendMatterOpeningFailure(testFormData, testError)
  .then(() => {
    console.log("✅ Test email notification sent successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to send test email:", error);
    process.exit(1);
  });