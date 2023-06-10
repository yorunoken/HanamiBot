const { google } = require("googleapis");
const fs = require("fs");

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const credentials = require("../../credentialsDrive.json");

const { client_email, private_key } = credentials;
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email,
    private_key,
  },
  scopes: SCOPES,
});

async function uploadFile(client, mapID, path) {
  const drive = google.drive({ version: "v3", auth: client });
  const fileMetadata = {
    name: `${mapID}.osz`,
  };
  const media = {
    mimeType: "*/*",
    body: fs.createReadStream(path),
  };

  try {
    const file = await new Promise((resolve, reject) => {
      drive.files.create(
        {
          resource: fileMetadata,
          media: media,
          fields: "id",
        },
        (err, file) => {
          if (err) {
            console.error("Error uploading file", err);
            reject(err);
          } else {
            resolve(file);
          }
        }
      );
    });

    const fileId = file.data.id;

    const permission = await new Promise((resolve, reject) => {
      drive.permissions.create(
        {
          fileId: fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        },
        (err, permission) => {
          if (err) {
            console.error("Error updating file permissions", err);
            reject(err);
          } else {
            resolve(permission);
          }
        }
      );
    });

    return `https://drive.google.com/file/d/${fileId}/view`;
  } catch (err) {
    console.error("Error uploading file", err);
  }
}

async function getFile(client, setID) {
  const drive = google.drive({ version: "v3", auth: client });

  try {
    const response = await drive.files.list({
      q: `name='${setID}.osz'`,
      fields: "files(id)",
    });

    const files = response.data.files;
    if (files.length > 0) {
      const fileId = files[0].id;
      return fileId;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}

function deleteAllFiles(client) {
  const drive = google.drive({ version: "v3", auth: client });

  drive.files.list({ fields: "files(id)" }, (err, response) => {
    if (err) {
      console.error("Error retrieving file list", err);
      return;
    }

    const files = response.data.files;
    if (files && files.length > 0) {
      files.forEach((file) => {
        drive.files.delete({ fileId: file.id }, (err, response) => {
          if (err) {
            console.error("Error deleting file", err);
          } else {
            console.log("File deleted:", file.id);
          }
        });
      });
    } else {
      console.log("No files found in Google Drive.");
    }
  });
}

async function authorize(setID, path) {
  const client = await auth.getClient();
  const url = await uploadFile(client, setID, path);
  return url;
}

async function authorize_file(setID) {
  const client = await auth.getClient();
  const fileId = await getFile(client, setID);
  return fileId;
}

async function deleteFiles() {
  const client = await auth.getClient();
  deleteAllFiles(client);
}
module.exports = { authorize, deleteFiles, authorize_file };
