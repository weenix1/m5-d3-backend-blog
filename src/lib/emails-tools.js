import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SEND_KEY);
console.log(process.env.SEND_KEY);

export const sendRegistrationEmailAttach = async (
  recipientAddress,
  pdf,
  title
) => {
  console.log(pdf);
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
