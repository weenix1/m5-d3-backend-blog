import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SEND_KEY);
console.log(process.env.SEND_KEY);

export const sendRegistrationEmail = async (recipientAddress, pdf, name) => {
  const msg = {
    to: recipientAddress,
    from: process.env.SENDER_EMAIL,
    subject: "quick reply",
    text: "Thanks for contacting us",
    html: "<strong>We are always there for you...</strong>",
    attachments: [
      {
        content: pdf,
        filename: `${title}`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };

  await sgMail.send(msg);
};
