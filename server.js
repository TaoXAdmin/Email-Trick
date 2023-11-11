require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const sharp = require('sharp');

var SibApiV3Sdk = require('sib-api-v3-sdk');
var defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configuration de l'API Key avec la clé stockée dans .env
var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Configuration de Multer pour les images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'images/')
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname) // Utiliser le nom original du fichier
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public')); // Serveur de fichiers statiques
app.use(bodyParser.json()); // Pour analyser les requêtes JSON

// Route pour télécharger des images
app.post('/upload', upload.single('image'), (req, res) => {
  res.send('Image téléchargée avec succès');
});

app.get('/', (req, res) => {
  res.send('Bonjour le monde de la magie!');
});

app.use('/images', express.static('images'));

// Liste des images
app.get('/images-list', (req, res) => {
  fs.readdir('images/', (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier images:', err);
      res.status(500).send('Erreur lors de la récupération des images');
    } else {
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
      res.json(imageFiles);
    }
  });
});

// Configuration de Multer pour l'administration
const adminUpload = multer({ dest: 'temp/' });
app.post('/admin/upload', adminUpload.single('newImage'), (req, res) => {
  const targetImageName = 'magic.jpg'; // Nom fixe de l'image à remplacer
  const newImagePath = req.file.path;
  const targetPath = `images/${targetImageName}`;

  // Redimensionner l'image
  sharp(newImagePath)
    .resize(600) // Redimensionne la largeur à 800px et ajuste la hauteur automatiquement
    .toFile(targetPath, (err) => {
      if (err) {
        console.error('Erreur lors du redimensionnement de l\'image:', err);
        return res.status(500).send('Erreur lors du redimensionnement de l\'image');
      }

      // Nettoyage du dossier temporaire
      fs.unlink(newImagePath, err => {
        if (err) {
          console.error('Erreur lors de la suppression du fichier temp:', err);
        }
      });

      res.send(`Image ${targetImageName} redimensionnée et remplacée avec succès`);
    });
});

// Route pour envoyer l'email magique
app.post('/send-magic-email', (req, res) => {
  const { email } = req.body;
  const imageUrl = 'http://localhost:3000/images/magic.jpg';

  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = "Your Magic Image";
  sendSmtpEmail.htmlContent = `<html><body><p>Check out your magic image here:</p><img src="${imageUrl}" alt="Magic Image"></body></html>`;
  sendSmtpEmail.sender = {"name": "Magicien", "email":"aboutamagictrick@gmail.com"};
  sendSmtpEmail.to = [{"email": email}];

  apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    res.json({message: 'Email envoyé'});
  }, function(error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).send('Erreur lors de l\'envoi de l\'email');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
