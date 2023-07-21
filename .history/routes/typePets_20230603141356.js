import { Router } from "express";
import { appFirebase, auth, db, storage } from "./firebase.js";
// appFirebase.initializeApp(appFirebaseConfig);

// const db = appFirebase.firestore();
const typePetCollection = db.collection("TypePets");
// const storage = appFirebase.storage();

const router = Router();

//Get all typePet
router.get("/", async (req, res) => {
  try {
    const typePetRef = await typePetCollection.get();
    const typePet = [];
    const typePetData = typePetRef.docs.map((doc) => {
    if (doc.data().status) {
      typePet.push(doc.data());
    } el
    });
    res.status(200).json(typePetData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Create a typePet
router.post("/", async (req, res) => {
  try {
    const base64EncodedImageString = req.body.file.split(";base64,").pop();
    const imageBuffer = Buffer.from(base64EncodedImageString, "base64");
    const metadata = {
      contentType: "image/jpeg",
    };
    const storageRef = storage.ref();
    const fileRef = storageRef.child(
      `images/TypePet/${Date.now()}_${req.body.nameType}`
    );
    await fileRef.put(imageBuffer, metadata);
    const imgPetUrl = await fileRef.getDownloadURL();

    const TypePetRef = typePetCollection.doc();
    const typePetId = TypePetRef.id;
    const newTypePet = {
      id_TypePet: typePetId,
      imgPet: imgPetUrl,
      nameType: req.body.nameType,
      status: req.body.status,
    };

    await TypePetRef.set(newTypePet);
    res.status(201).json(newTypePet);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Update status a TypePet
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const typePetRef = typePetCollection.doc(id);
    const typePet = await typePetRef.get();

    if (!typePet.exists) {
      return res.status(404).json({ message: "TypePet not found" });
    }

    const updatedTypePet = {
      status: req.body.status,
    };

    await typePetRef.update(updatedTypePet);

    res.status(200).json({ id_TypePet: id, ...updatedTypePet });
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
