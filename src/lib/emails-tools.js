import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SEND_KEY);
console.log(process.env.SEND_KEY);

export const sendRegistrationEmail = async (recipientAddress) => {
  const msg = {
    to: recipientAddress,
    from: process.env.SENDER_EMAIL,
    subject: "quick reply",
    text: "Thanks for contacting us",
    html: "<strong>We are always there for you...</strong>",
  };

  await sgMail.send(msg);
};
