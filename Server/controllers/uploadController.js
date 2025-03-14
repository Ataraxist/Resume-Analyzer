import fs from 'fs/promises';
import yaml from 'js-yaml';
import { extractTextFromFile } from '../utils/extractTextFromFile.js';
import generateYAMLWithAI from '../utils/convertTextToYAML.js';
import YAMLModel from '../models/YAMLModel.js';

const uploadController = {};

uploadController.processUpload = async (req, res, next) => {
  console.log('👓 Processing File Upload!');
  console.log("req.file is", req.file)
  
  if (!req.file)
    return next({
      log: 'uploadController did nto receive a valid file.',
      status: 500,
      message: { err: 'No file to process.' },
    });

  const { path, mimetype } = req.file;

try {

  const supportedFormats = [
    'application/pdf',
    'text/plaiin',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!supportedFormats.includes(mimetype)) {
    throw new Error('Unsupported file format. Please uplaod a PDF, text, or Word document.');
  }
  
  const extractedText = await extractTextFromFile(path, mimetype);

  const yamlData = await generateYAMLWithAI(extractedText);  
  console.log("✅ AI-Generated YAML:", yamlData);
  const yamlString = yaml.dump(yamlData); 

  const savedData = await YAMLModel.create(yamlData);

  //const { path, mimetype } = req.file;

  // const path = '/home/msymeonoglou/project/Projects/AI_Project/Resume-Analyzer/Resume-Analyzer/Server/uploads/test.txt'
  // const mimetype = 'text/plain'

  // await extractTexted(path, mimetype)
  //   .then(async (extractedText) => {
      // Convert extracted text to YAML format
      // const yamlData = convertTextToYAML(extractedText)
      // const yamlData = await generateYAMLWithAI(extractedText);
      // const yamlString = yaml.dump(yamlData);

      // Save YAML data to MongoDB
    //   return YAMLModel.create(yamlData).then((savedData) => ({
    //     yamlString,
    //     savedData,
    //   }));
    // })
    // TODO: Not sure this is what should be sent back, since the AI response is actually what we need.
    // Send an all clear response back
    .then((savedData) => {
      res.locals.yamlResume = savedData,
      next()
    })
    // Catch errors
    .catch((error) => {
      console.error("❌ Error in processUpload:", error);
      res.status(500).json({ error: error.message });
    })
    // Remove the file from uploads
    .finally(() => {
      fs.unlink(path).catch((err) => console.error("Error deleting file:", err));
    });
};

export default uploadController;