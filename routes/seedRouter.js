import express from "express";
import Inquiry from "../models/Inquiry.js";
import Category from "../models/Category.js";
import Document from "../models/Document.js";
import DocumentType from "../models/DocumentType.js";
import User from "../models/User.js";
import Client from "../models/Client.js";
import InquiryType from "../models/InquiryType.js";
import bcrypt from "bcrypt";

const seedRouter = express.Router();

seedRouter.post("/", async (req, res) => {
    try {
        await Client.deleteMany({});
        await User.deleteMany({});
        await Category.deleteMany({});
        await Document.deleteMany({});
        await DocumentType.deleteMany({});
        await InquiryType.deleteMany({});
        await Inquiry.deleteMany({});
        const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

        // de clients

        //client_3A
        const client_3A = new Client({ name: "Client 3A", is_active: true });
        await client_3A.save();

        const password_3A = await bcrypt.hash("wachtwoord3A", 10);
        const user_3A = new User({ client_id: client_3A._id, first_name: "Anna", last_name: "Jansen",
            gender: "Vrouw", email: "annajansen@email.nl", adres: "Wijnhaven 107", nationality: "Nederlandse", postcode: "3011 WN",
            birth_date: new Date("2000-05-12"), phone_number: "0612345678", password_hash: password_3A, is_admin: false, personalization_enabled: true,
            bsn: "123456789" });
        await user_3A.save();

        const admin_3A = await bcrypt.hash("adminwachtwoord3A", 10);
        const adminUser_3A = new User({
            client_id: client_3A._id, first_name: "Admin", last_name: "3A",
            gender: "Man", email: "admin3a@cmgt.nl", adres: "Wijnhaven 107", nationality: "Nederlandse", postcode: "3011 WN",
            birth_date: new Date("1990-01-01"), phone_number: "0611111111", password_hash: admin_3A, is_admin: true, personalization_enabled: true,
            bsn: "111111111"
        });
        await adminUser_3A.save();

        await Category.insertMany(
            ["Subsidies", "Jongeren", "Mijn uitkering", "Verhuizen",
                "Geldzorgen", "Zorg dichtbij", "Belastingen", "Parkeren",
                "Grofvuil", "Paspoort & ID", "Verblijfsvergunning"]
                .map(name => ({ client_id: client_3A._id, name }))
        );

        const documentTypes_3A = await DocumentType.insertMany(
            ["groenpas", "milieupas", "parkeervergunning", "paspoort"]
                .map(name => ({ name }))
        );

        await Document.insertMany(
            documentTypes_3A.map(type => ({
                user_id: user_3A._id,
                type_id: type._id,
                start_date: randomDate(new Date(2020, 0, 1), new Date()),
                end_date: randomDate(new Date(), new Date(2028, 0, 1)),
                extended: false
            }))
        );

        //client_3B
        const client_3B = new Client({ name: "Client 3B", is_active: true });
        await client_3B.save();

        const password_3B = await bcrypt.hash("wachtwoord3B", 10);
        const user_3B = new User({ client_id: client_3B._id, first_name: "Bas", last_name: "de Vries",
            gender: "Man", email: "Bas@email.nl", adres: "'s-Gravenweg 123", nationality: "Nederlands", postcode: "2911 AA",
            birth_date: new Date("1950-03-05"), phone_number: "0612345678", password_hash: password_3B, is_admin: false, personalization_enabled: true,
            bsn: "123456385" });
        await user_3B.save();

        const admin_3B = await bcrypt.hash("adminwachtwoord3B", 10);
        const adminUser_3B = new User({
            client_id: client_3B._id, first_name: "Admin", last_name: "3B",
            gender: "Man", email: "admin3b@zuidplas.nl", adres: "'s-Gravenweg 123", nationality: "Nederlands",
            postcode: "2911 AA", birth_date: new Date("1990-01-01"), phone_number: "0622222222", password_hash: admin_3B,
            is_admin: true, personalization_enabled: true,
            bsn: "222222222"
        });
        await adminUser_3B.save();

        await Category.insertMany(
            ["Omgeving", "Wonen", "Leven", "Aanvragen", "Werk en inkomen", "Gezondheid en vrijheid"]
                .map(name => ({ client_id: client_3B._id, name }))
        );

        const inquiryTypes = await InquiryType.insertMany(
            ["Uw Woning aanpassen", "Vervoer", "Begeleiding", "Hulpmiddelen",
                "Dagbesteding", "Hulp bij maaltijden", "Hulp met boodschappen",
                "Hulp bij persoonlijke verzorging", "Hulp bij dementie",
                "Hulp bij het huishouden"].map(name => ({ name }))
        );

        const inquiry_WMO = new Inquiry({
            client_id: client_3B._id, user_id: user_3B._id, type_id: inquiryTypes[0]._id,
            created_at: new Date(), content: "Ik heb een aanvraag voor een WMO-voorziening ingediend...",
            token: "seed-token-wmo-001", status: "In behandeling",
            question: "Wat is de status van mijn WMO-aanvraag?"
        });
        await inquiry_WMO.save();

        const documentTypes_3B = await DocumentType.insertMany(
            ["afval", "parkeervergunning", "paspoort", "WMO", "rijbewijs"]
                .map(name => ({ name }))
        );

        await Document.insertMany(
            documentTypes_3B.map(type => ({
                user_id: user_3B._id, type_id: type._id,
                start_date: randomDate(new Date(2020, 0, 1), new Date()),
                end_date: randomDate(new Date(), new Date(2028, 0, 1)),
                extended: false
            }))
        );

        res.status(200).json({ message: "Seeding succesvol!" });

    } catch (e) {
        console.error("Error bij seeden van data:", e);
        return res.status(500).json({ message: "Server error tijdens seeden" });
    }
});

export default seedRouter;