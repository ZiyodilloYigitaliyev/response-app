import React, { useState, useEffect } from "react";
import axios, { AxiosHeaders } from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';  // Bootstrap CSS
import bootstrap from 'bootstrap';  // Bootstrap JS
import { Tab } from 'bootstrap';  // Bootstrap JS Tab moduli
import {
    Page,
    Text,
    View,
    Document,
    pdf,
    PDFDownloadLink,
    StyleSheet,
} from "@react-pdf/renderer";
import { PDFDocument, rgb } from "pdf-lib";
import JSZip from "jszip";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import "./dashboard.css";

function Dashboard() {
    const [errorMessage, setErrorMessage] = useState("");
    const [forms, setForms] = useState([]); // forms va setForms ni aniqlash
    const [loading, setLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileFields, setFileFields] = useState([]);

    const API_URL = "https://scan-app-a3872b370d3e.herokuapp.com/api/questions";
    // Fayl qo'shish funksiyasi
    const addFileField = () => {
        if (fileFields.length < 5) {
            setFileFields([
                ...fileFields,
                { id: Date.now(), file: null, category: "", subject: "" },
            ]);
        } else {
            alert("Siz maksimal 5 ta fayl qo'sha olasiz!");
        }
    };

    // Fayl tanlashda ma'lumotni yangilash
    const handleFileChange = (id, field, value) => {
        const updatedFields = fileFields.map((fileField) =>
            fileField.id === id ? { ...fileField, [field]: value } : fileField
        );
        setFileFields(updatedFields);
    };

    // Fayl maydonini olib tashlash
    const removeFileField = (id) => {
        setFileFields(fileFields.filter((fileField) => fileField.id !== id));
    };

    // Formani yuborish funksiyasi
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Hamma formalarni tekshirish
            for (let form of fileFields) {
                if (!form.file || !form.category || !form.subject) {
                    alert("Iltimos, barcha maydonlarni to‘ldiring va faylni tanlang.");
                    setLoading(false);
                    return;
                }

                // FormData ni to‘ldirish
                const formData = new FormData();
                formData.append("file", form.file); // `form.files` o‘rniga `form.file`
                formData.append("category", form.category);
                formData.append("subject", form.subject);

                // Serverga yuborish
                const response = await axios.post(
                    "https://scan-app-a3872b370d3e.herokuapp.com/savol/yuklash/",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                console.log("Server javobi:", response.data);
            }
            const value = prompt("Nechta savol kerakligini kiriting:");
            const grade = prompt("Nechinchi sinf uchun savollar kerakligini kiriting:");

            if (!value || isNaN(value) || parseInt(value) <= 0) {
                alert("Iltimos, to'g'ri savollar sonini kiriting.");
                return;
            }

            try {
                // Savollarni olish
                const questionsResponse = await axios.get(
                    "https://scan-app-a3872b370d3e.herokuapp.com/savol/questions/"
                );
                const questionsData = questionsResponse.data;

                // Final ma'lumot tuzilmasi
                const finalData = [
                    {
                        num: {
                            additional_value: parseInt(value),
                            class: parseInt(grade) // 'num' ichida 'grade' ni qo'shish
                        },
                        data: questionsData.data
                    },
                ];

                console.log("Final Data Structure:", JSON.stringify(finalData, null, 2));

                // Savollarni yuborish
                await axios.post(
                    "https://scan-app-a3872b370d3e.herokuapp.com/api/questions",
                    finalData,
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );

                alert("Savollar muvaffaqiyatli yuborildi!");

                // Savollarni o'chirish
                // await fetch("https://create-test-app-100ceac94608.herokuapp.com/delete-all-questions/", { method: "DELETE" });
            } catch (error) {
                console.error("Xatolik yuz berdi:", error);
                alert("Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
            }
        } catch (error) {
            console.error("Xatolik yuz berdi:", error);
            setErrorMessage(error.message);
            alert("Xatolik yuz berdi: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    // Rasmni yuklab olish va Base64 formatga aylantirish funksiyasi
    const fetchImageAsBase64 = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl, { mode: "no-cors" });
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Rasmni yuklashda xatolik:", error);
            return null;
        }
    };


    // Muqova yaratish
    const renderCover = async (listId, pdf, questions) => {

        const pageWidth = pdf.internal.pageSize.getWidth(); // Sahifa kengligi
        const pageHeight = pdf.internal.pageSize.getHeight(); // Sahifa balandligi
        const marginLeft = pageWidth * 0.1; // Matn chapdan boshlanishi uchun chekka (10% sahifa kengligidan)
        const marginBottom = 20; // Sahifaning pastki chekkasidan bo'sh joy
        const lineHeight = 6; // Har bir qator orasidagi masofa

        // Rasmning yangi kenglik va balandligini hisoblash
        const originalWidth = 500; // Rasmning asl kengligi (pixellar bilan)
        const originalHeight = 300; // Rasmning asl balandligi (pixellar bilan)

        // O'lchamni moslashtirish (sahifa kengligi bo'yicha)
        const newWidth = pageWidth * 0.8; // Sahifa kengligining 80% qismi
        const newHeight = (originalHeight / originalWidth) * newWidth; // Nisbatga ko'ra balandlik

        // Rasmni joylashuvi (markazlash)
        const xPosition = (pageWidth - newWidth) / 2; // Rasmni gorizontal markazga joylashtirish
        const yPosition = 0; // Rasmni sahifaning yuqorisiga joylash

        // Rasmni qo'shish
        pdf.addImage(
            "https://scan-app-uploads.s3.eu-north-1.amazonaws.com/2.jpg",
            "JPEG",
            xPosition,
            yPosition,
            newWidth,
            newHeight
        );
        // Yuqori matnlar
        pdf.setFont("times", "normal");
        pdf.setFontSize(16);
        pdf.text("Qashqadaryo viloyati Guzor tuman \"Buxoro qorako'l\"", (pageWidth - pdf.getTextWidth("Qashqadaryo viloyati G'uzor tuman 'Buxoro qorako'l'")) / 2, 80);
        pdf.text("xususiy maktabining savollar kitobi", (pageWidth - pdf.getTextWidth("xususiy maktabining savollar kitobi")) / 2, 88);

        pdf.setFontSize(12);
        pdf.text("Oliy ta'lim muassasalariga kiruvchilar uchun", (pageWidth - pdf.getTextWidth("Oliy ta'lim muassasalariga kiruvchilar uchun")) / 2, 100);
        pdf.text("Savollar kitobi", (pageWidth - pdf.getTextWidth("Savollar kitobi")) / 2, 107);

        pdf.text("5-sinflar", (pageWidth - pdf.getTextWidth("5-sinflar")) / 2, 130);
        pdf.text(`Savollar kitobi raqami: ${listId.toString().padStart(4, "0")}`, (pageWidth - pdf.getTextWidth(`Savollar kitobi raqami: ${listId.toString().padStart(4, "0")}`)) / 2, 136);

        // Jadvalni tayyorlash uchun ma'lumotlar
        const tableData = [];

        // Savollarni qayta ishlash
        questions.forEach((question) => {
            const { category, question_id, subject } = question;

            if (category.startsWith("Majburiy_fan")) {
                // Majburiy fanlar uchun 10 tadan bo‘lak
                const blockNumber = Math.ceil(question_id / 10);
                const rangeStart = (blockNumber - 1) * 10 + 1;
                const rangeEnd = blockNumber * 10;

                // Yagona qatorni yig'ish
                const existingRow = tableData.find((row) => row.category === "Majburiy_fan");
                if (existingRow) {
                    // Mavjud bo‘lsa, interval va mavzuni qo‘shish
                    existingRow.range = `${existingRow.range}, ${rangeStart}-${rangeEnd}`;
                    existingRow.subjects = `${existingRow.subjects}, ${subject}`;
                } else {
                    // Yangi qator qo‘shish
                    tableData.push({
                        range: `${rangeStart}-${rangeEnd}`,
                        subjects: subject,
                        category: "Majburiy_fan",
                    });
                }
            } else if (category === "Fan_1" || category === "Fan_2") {
                // Fan_1 va Fan_2 uchun 30 tadan bo‘lak
                const blockNumber = Math.ceil(question_id / 30);
                const rangeStart = (blockNumber - 1) * 30 + 1;
                const rangeEnd = blockNumber * 30;

                // Jadvalga qo'shish yoki mavjud qatorni yangilash
                const existingRow = tableData.find((row) => row.range === `${rangeStart}-${rangeEnd}`);
                if (existingRow) {
                    // Mavjud bo‘lsa, mavzuni qo‘shish
                    existingRow.subjects = `${existingRow.subjects}, ${subject}`;
                } else {
                    // Yangi qator qo‘shish
                    tableData.push({
                        range: `${rangeStart}-${rangeEnd}`,
                        subjects: subject,
                    });
                }
            }
        });

        // Majburiy_fan uchun kategoriyani olib tashlash
        tableData.forEach((row) => delete row.category);



        // Jadval ustunlari va ma'lumotlarni sozlash
        const columns = [
            { header: "Savollar soni", dataKey: "range" },
            { header: "Mavzular", dataKey: "subjects" },
        ];

        // Jadvalni chiziqlar bilan yaratish
        pdf.autoTable({
            columns: columns, // Ustunlarni belgilash
            body: tableData, // Jadval uchun ma'lumot
            startY: 150, // Jadvalni yuqoridan joylash
            // tableWidth: 'wrap', // Jadval ma'lumotga qarab o'lchami
            margin: { left: 50, right: 50 }, // Jadvalni markazlashtirib, eni kichrayadi
            theme: "plain", // Oddiy jadval uslubi
            columnStyles: {
                0: { cellWidth: 50 }, // 1-ustun kengligi
                1: { cellWidth: 70 }, // 2-ustun kengligi
            },
            styles: {
                halign: 'center', // Gorizontal o'rtaga
                valign: 'middle', // Vertikal o'rtaga
                fontSize: 10, // Matn shrift hajmi
                cellPadding: 2, // Hujayra ichidagi matn atrofidagi bo'shliq
                lineWidth: 0.1, // Chiziq qalinligi (ingichka chiziq)
                lineHeight: 2, // Qatorlar orasidagi masofani kamaytirish
                lineColor: [0, 0, 0], // Chiziq rangi qora
            },
            headStyles: {
                fillColor: [255, 255, 255], // Sarlavha fonini o‘zgartirish
                textColor: [0, 0, 0], // Sarlavha matn rangi
                lineWidth: 0.2, // Sarlavha chiziq qalinligi
                lineColor: [0, 0, 0], // Sarlavha chiziq rangi
            },
            bodyStyles: {
                lineWidth: 0.2, // Jadval tanasi chiziq qalinligi
                lineColor: [0, 0, 0], // Jadval tanasi chiziq rangi qora
            },
        });

        var text = "Test topshiruvchi: _________________________________________________   _________";
        var textWidth = pdf.getTextWidth(text);  // Matnning uzunligini hisoblaymiz
        var startX = (pageWidth - textWidth) / 2;  // Matnni o'rtaga joylashtirish uchun boshlanish nuqtasi
        pdf.text(text, startX, 210);  // Matnni o'rtada joylashtirish

        // Pastki yo'riqnoma matni
        const instructions = [
            "1. Test topshiriqlarini bajarish uchun berilgan vaqt 2 soat;",
            "2. Savollar kitobini o'zingiz bilan olib ketishingiz va o'z ustingizda ishlashingiz mumkin;",
            "3. Javoblar varaqasini e'tibor bilan bo'yashingiz shart;",
            "4. Test natijalari 5 ish kuni davomida e'lon qilinadi;",
            "5. Natijalar @bukhara_maktabi rasmiy kanalida e'lon qilinadi;",
        ];

        const totalHeight = instructions.length * lineHeight; // Matn balandligi
        let yPos = pageHeight - marginBottom - totalHeight; // Matnni pastki chegaraga joylashtirish uchun boshlang'ich pozitsiya

        // Yo'riqnoma sarlavhasini qo'shish
        pdf.setFont("times", "bold");
        pdf.setFontSize(13);
        pdf.text("Test bajaruvchi uchun yo'riqnoma:", (pageWidth - pdf.getTextWidth("Test bajaruvchi uchun yo'riqnoma:")) / 2, yPos);
        yPos += lineHeight;

        // Yo'riqnoma matnini qo'shish
        pdf.setFont("times", "bold");
        pdf.setFontSize(12);
        instructions.forEach((line) => {
            pdf.text(line, marginLeft, yPos);
            yPos += lineHeight; // Har bir qator uchun masofa
        });

        pdf.addPage(); // Keyingi sahifaga o'tish
    };



    // Chegara va sahifa raqamlarini qo'shish funksiyasi
    const addBordersAndPageNumbers = (pdf) => {
        const totalPages = pdf.internal.getNumberOfPages(); // Umumiy sahifalar soni
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // Chegaralarni chizish
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

            // Sahifa raqami qo'shish
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(
                `Sahifa: ${i} / ${totalPages}`,
                pageWidth / 2,
                pageHeight - 5,
                { align: 'center' }
            );
        }
    };

    const renderQuestions = async (item, pdf) => {
        const questionsData = [];
        let currentCategory = ""; // Kategoriya kuzatish
        let currentSubject = "";  // Subject kuzatish

        // Savollarni `question_id` bo'yicha tartiblang
        const sortedQuestions = item.questions.sort((a, b) => a.question_id - b.question_id);

        for (const question of sortedQuestions) {
            // Yangi kategoriya yoki subject bo'lsa, jadvalga qo'shish
            if (question.category !== currentCategory || question.subject !== currentSubject) {
                currentCategory = question.category;
                currentSubject = question.subject;

                // Faqat real kategoriya mavjud bo'lsa qo'shish
                if (currentCategory && currentSubject) {
                    questionsData.push([
                        {
                            content: `${currentCategory} (${currentSubject}):`, // Kategoriya va subjectni qisqacha joylash
                            colSpan: 2, // Ikki ustunli bo'lishi uchun
                            styles: { fontStyle: 'bold', textColor: [41, 128, 185], fontSize: 10 }, // Kichikroq font
                        },
                    ]);
                }
            }

            // Savollar va variantlarni formatlash
            const formatOptions = (options) => {
                if (!options) return [];
                return options
                    .split(/[A-D]\)/) // 'A)', 'B)', 'C)', 'D)' bo'yicha ajratish
                    .map((opt) => opt.trim()) // Har bir elementni tozalash
                    .filter((opt) => opt);    // Bo'sh qiymatlarni olib tashlash
            };
            // const cleanedQuestion = {
            //     ...question,
            //     text: question.text.replace(/^\d+\.\s*/, ''), // Savoldan tartib raqamini olib tashlash
            //     options: formatOptions(question.options) // Variantlarni formatlash
            // };

            // Variantlarni o'qib olish va bitta qatorda joylashtirish
            const formattedOptions = formatOptions
                .map((option, idx) => `${String.fromCharCode(65 + idx)}) ${option}`)
                .join(" | "); // Variantlar bir qatorda ajratilgan

            let questionBlock = `${question.question_id}. ${question.text} \n Variantlar: ${formattedOptions}`;

            // Agar rasm bo'lsa, rasmni qo'shish
            if (question.image) {
                const base64Image = await fetchImageAsBase64(question.image);
                if (base64Image) {
                    questionsData.push([
                        { content: questionBlock, styles: { fontSize: 9, cellWidth: 'auto' } },
                        {
                            image: base64Image,
                            width: 25,
                            height: 25,
                            styles: { halign: 'center', valign: 'middle' },
                        },
                    ]);
                }
            }

        }

        // Jadvalni chizish
        if (questionsData.length > 0) {
            pdf.autoTable({
                body: questionsData,
                startY: 20, // Jadval yuqoridan boshlanadi
                styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', cellWidth: 'auto' },
                headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontSize: 10 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 40 },
                },
                willDrawCell: (data) => {
                    const pageHeight = pdf.internal.pageSize.height;
                    if (data.row.y + data.row.height > pageHeight - 20) {
                        pdf.addPage();
                        data.row.y = 20; // Har bir sahifa jadvalini yuqoridan boshlash
                    }
                },
            });

        }
        // Chegara va sahifa raqamlari
        addBordersAndPageNumbers(pdf);
    };


    // Ma'lumotlarni yuklash va PDF'ga qo'shish funksiyasi
    const fetchDataAndGenerateZip = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("API ma'lumotlarini olishda xatolik yuz berdi");

            const data = await response.json();
            const zip = new JSZip();

            for (const item of data) {
                const pdf = new jsPDF({
                    orientation: 'portrait', // Portret rejimi
                    unit: 'mm',              // O'lchov birligi (mm - millimetr)
                    format: 'a4',            // A4 format
                });


                // Muqova yaratish
                await renderCover(item.list_id, pdf, item.questions);

                // Savollarni qo'shish
                await renderQuestions(item, pdf);

                // PDF faylni ZIPga qo'shish
                const pdfBlob = pdf.output("blob");
                zip.file(`list_${item.list_id}.pdf`, pdfBlob);
            }

            // ZIP faylni yaratish va yuklab olish
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, "Savollar_kitobi.zip");
        } catch (error) {
            console.error("Xatolik:", error.message);
            alert("Xatolik yuz berdi: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // JavaScript to show/hide content for different tabs (optional for more complex logic)
        const pillsTab = new Tab(document.getElementById('pills-profile-tab'));
        pillsTab.show(); // Show the Result tab by default
    }, []); // Empty dependency array ensures this runs once when the component mounts
    return (
        <div className="container-fluid mt-4">
            <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                <li className="nav-item">
                    <a className="nav-link active" id="pills-home-tab" data-bs-toggle="pill" href="#pills-home" role="tab" aria-controls="pills-home" aria-selected="true">
                        Home
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" id="pills-profile-tab" data-bs-toggle="pill" href="#pills-profile" role="tab" aria-controls="pills-profile" aria-selected="false">
                        Result
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" id="pills-contact-tab" data-bs-toggle="pill" href="#pills-contact" role="tab" aria-controls="pills-contact" aria-selected="false">
                        Dashboard
                    </a>
                </li>
            </ul>

            <div className="tab-content">
                <div className="tab-pane fade show active" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab">
                    <div className="container mt-4">
                        <div className="row">
                            <div className="col-12 col-md-4">
                                <div className="card">
                                    <div className="card-body">
                                        <button className="btn btn-primary" onClick={fetchDataAndGenerateZip} disabled={isLoading}>
                                            {isLoading ? "Yuklanmoqda..." : "ZIPni Yuklab Olish"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Tab */}
                <div
                    className="tab-pane fade"
                    id="pills-profile"
                    role="tabpanel"
                    aria-labelledby="pills-profile-tab"
                >
                    <form className="d-flex flex-column align-items-center" onSubmit={handleSubmit}>
                        <div className="file-fields-container mb-3">
                            {fileFields.map((fileField) => (
                                <div key={fileField.id} className="file-fields mb-3">
                                    <label htmlFor={`fileInput${fileField.id}`}>Fayl {fileField.id}:</label>
                                    <input
                                        type="file"
                                        id={`fileInput${fileField.id}`}
                                        name="files"
                                        accept=".zip"
                                        onChange={(e) => handleFileChange(fileField.id, "file", e.target.files[0])}
                                        required
                                        className="form-control mb-2"
                                    />
                                    <label htmlFor={`categorySelect${fileField.id}`}>Kategoriya:</label>
                                    <select
                                        id={`categorySelect${fileField.id}`}
                                        name="category"
                                        value={fileField.category}
                                        onChange={(e) => handleFileChange(fileField.id, "category", e.target.value)}
                                        required
                                        className="form-control mb-2"
                                    >
                                        <option value="">Kategoriya tanlang</option>
                                        <option value="Majburiy_Fan_1">Majburiy_Fan_1</option>
                                        <option value="Majburiy_Fan_2">Majburiy_Fan_2</option>
                                        <option value="Majburiy_Fan_3">Majburiy_Fan_3</option>
                                        <option value="Fan_1">Fan_1</option>
                                        <option value="Fan_2">Fan_2</option>
                                    </select>
                                    <label htmlFor={`subjectSelect${fileField.id}`}>Mavzu:</label>
                                    <select
                                        id={`subjectSelect${fileField.id}`}
                                        name="subject"
                                        value={fileField.subject}
                                        onChange={(e) => handleFileChange(fileField.id, "subject", e.target.value)}
                                        required
                                        className="form-control mb-2"
                                    >
                                        <option value="">Mavzu tanlang</option>
                                        <option value="Algebra">Algebra</option>
                                        <option value="Geometriya">Geometriya</option>
                                        <option value="Kimyo">Kimyo</option>
                                        <option value="Fizika">Fizika</option>
                                        <option value="Ona tili">Ona tili</option>
                                    </select>
                                    <button
                                        type="button"
                                        className="remove-file-btn btn btn-danger btn-sm mt-2"
                                        onClick={() => removeFileField(fileField.id)}
                                    >
                                        - Faylni o'chirish
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Fayl qo'shish va yuborish tugmalari */}
                        <div className="d-flex justify-content-center w-100">
                            <button
                                type="button"
                                onClick={addFileField}
                                className="btn btn-success btn-sm w-auto mx-5"
                                disabled={fileFields.length >= 5} // 5 tadan ortiq fayl qo'shishni cheklash
                            >
                                + Fayl qo'shish
                            </button>
                            <button type="submit" className="btn btn-primary btn-sm w-auto mx-5">
                                So'rov yuborish
                            </button>
                        </div>

                        {/* Fayllar haqida ma'lumot */}
                        <div className="alert alert-info mt-3 w-100" role="alert">
                            <strong>Yuklangan fayllar:</strong>
                            <ul>
                                {fileFields.map((fileField) => (
                                    <li key={fileField.id}>
                                        Fayl: {fileField.file ? fileField.file.name : "Fayl tanlanmagan"} |
                                        Kategoriya: {fileField.category || "Tanlanmagan"} |
                                        Mavzu: {fileField.subject || "Tanlanmagan"}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </form>
                </div>


                {/* Dashboard Tab */}
                <div className="tab-pane fade" id="pills-contact" role="tabpanel" aria-labelledby="pills-contact-tab">
                    <div className="container mt-4">
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-body">
                                        <p>Dashboard kontenti...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}

export default Dashboard;
