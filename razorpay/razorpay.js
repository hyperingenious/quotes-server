// https://api.razorpay.com/v1/payment_links/{plink_id}/cancel
const { AVID_READER_MONTHLY, READER_MONTHLY } = require('./subscription')
const crypto = require('crypto');

async function cancel_payment_link({ plink_id }) {
    console.log(`Cancelling payment link with ID: ${plink_id}`);
    try {
        const username = process.env.RAZORPAY_KEY_ID;
        const password = process.env.RAZORPAY_KEY_SECRET;

        const headers = new Headers();

        headers.append('Authorization', "Basic " + btoa(username + ":" + password));
        headers.append("Content-Type", "application/json");

        const url = `https://api.razorpay.com/v1/payment_links/${plink_id}/cancel`;
        console.log(`Making request to ${url}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: headers
        });

        if (!response.ok) {
            console.error(`Razorpay API request failed with status ${response.status}`);
            const errorData = await response.json();
            const errorMessage = errorData.error.description || response.statusText;
            throw new Error(`Razorpay API request failed: ${errorMessage} (Status code: ${response.status})`);
        }
        const responseData = await response.json();
        console.log(`Payment link cancelled successfully:`, responseData);
        return responseData;
    } catch (error) {
        console.error("Error cancelling payment link:", error);
        throw new Error(`Failed to cancel payment link: ${error.message}`);
    }
}

async function create_payment_link({ email, subscription_type }) {
    console.log(`Creating payment link for email: ${email}, subscription type: ${subscription_type}`);
    try {
        const username = process.env.RAZORPAY_KEY_ID;
        const password = process.env.RAZORPAY_KEY_SECRET;
        const reference_id = crypto.randomUUID()

        const headers = new Headers();

        headers.append('Authorization', "Basic " + btoa(username + ":" + password));
        headers.append("Content-Type", "application/json");
        const url = `https://api.razorpay.com/v1/payment_links`;

        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 1);
        const expireTime = Math.floor(currentDate.getTime() / 1000);

        const amount = subscription_type == 'reader' ? READER_MONTHLY.amount : AVID_READER_MONTHLY.amount;
        const description = `Payment for ${subscription_type == 'reader' ? "Reader Subscription" : "Avid Reader"} subscription`;

        const data = {
            // acccepts in paisa
            amount,
            upi_link: "true",
            currency: "INR",
            accept_partial: false,
            expire_by: expireTime,
            reference_id,
            description: description,
            customer: {
                email: email
            },
            notify: {
                email: true
            },
            reminder_enable: true,
            notes: {
                policy_name: description
            },
            callback_url: "https://dub.sh/pnight",
            callback_method: "get"
        }
        console.log(`Making request to ${url} with data:`, data);
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            console.error(`Razorpay API request failed with status ${response.status}`);
            const errorData = await response.json();
            const errorMessage = errorData.error.description || response.statusText;
            throw new Error(`Razorpay API request failed: ${errorMessage} (Status code: ${response.status})`);
        }
        const responseData = await response.json();
        console.log(`Payment link created successfully:`, responseData);
        return responseData;

    } catch (error) {
        console.error("Error creating payment link:", error);
        throw new Error(`Failed to create payment link: ${error.message}`);
    }
}

module.exports = {
    cancel_payment_link, create_payment_link
}
