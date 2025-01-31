import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosHeaders } from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';  // Bootstrap CSS
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Tab } from 'bootstrap';  // Bootstrap JS Tab moduli
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import "./dashboard.css";



function Dashboard() {
    const [errorMessage, setErrorMessage] = useState("");
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileFields, setFileFields] = useState([]);
    const [selectedDate, setSelectedDate] = useState();  // Sana holati
    const [data, setData] = useState([]); // API'dan olingan ma'lumotlar
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [questions, setQuestions] = useState([]);
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
        e.preventDefault(); // Form default submitini to‘xtatish
        setLoading(true); // Yuklanish holatini o‘rnatish

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
                formData.append("file", form.file);
                formData.append("category", form.category);
                formData.append("subject", form.subject);

                // Serverga yuborish
                const response = await axios.post(
                    "https://scan-app-9206bf041b06.herokuapp.com/savol/yuklash/",
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
                setLoading(false); // Yuklanish holatini o‘chirish
                return;
            }

            // Savollarni olish va yuborish
            try {
                const questionsResponse = await axios.get(
                    "https://scan-app-9206bf041b06.herokuapp.com/savol/questions/"
                );
                const questionsData = questionsResponse.data;

                const finalData = [
                    {
                        num: {
                            additional_value: parseInt(value),
                            class: parseInt(grade),
                        },
                        data: questionsData.data,
                    },
                ];

                console.log("Final Data Structure:", JSON.stringify(finalData, null, 2));

                await axios.post(
                    "https://scan-app-9206bf041b06.herokuapp.com/api/questions",
                    finalData,
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );

                alert("Savollar muvaffaqiyatli yuborildi!");
            } catch (error) {
                console.error("Xatolik yuz berdi:", error);
                alert("Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
            }

            // DELETE so'rovi yuborish
            try {
                const response = await fetch(
                    "https://scan-app-9206bf041b06.herokuapp.com/savol/delete-all-questions/",
                    {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.ok) {
                    console.log("Barcha savollar o‘chirildi!");
                } else {
                    console.error("Savollarni o‘chirishda xatolik yuz berdi", response.status);
                }
            } catch (error) {
                console.error("Tarmoq yoki server xatosi:", error);
            }
        } catch (error) {
            console.error("Xatolik yuz berdi:", error);
            setErrorMessage(error.message);
            alert("Xatolik yuz berdi: " + error.message);
        } finally {
            setLoading(false); // Holatni tiklash
        }
    };


    // // Muqova yaratish
    // const renderCover = async (listId, pdf, questions) => {

    //     const pageWidth = pdf.internal.pageSize.getWidth(); // Sahifa kengligi
    //     const pageHeight = pdf.internal.pageSize.getHeight(); // Sahifa balandligi
    //     const marginLeft = pageWidth * 0.1; // Matn chapdan boshlanishi uchun chekka (10% sahifa kengligidan)
    //     const marginBottom = 20; // Sahifaning pastki chekkasidan bo'sh joy
    //     const lineHeight = 6; // Har bir qator orasidagi masofa

    //     // Rasmning yangi kenglik va balandligini hisoblash
    //     const originalWidth = 500; // Rasmning asl kengligi (pixellar bilan)
    //     const originalHeight = 300; // Rasmning asl balandligi (pixellar bilan)

    //     // O'lchamni moslashtirish (sahifa kengligi bo'yicha)
    //     const newWidth = pageWidth * 0.8; // Sahifa kengligining 80% qismi
    //     const newHeight = (originalHeight / originalWidth) * newWidth; // Nisbatga ko'ra balandlik

    //     // Rasmni joylashuvi (markazlash)
    //     const xPosition = (pageWidth - newWidth) / 2; // Rasmni gorizontal markazga joylashtirish
    //     const yPosition = 0; // Rasmni sahifaning yuqorisiga joylash

    //     // Rasmni qo'shish
    //     pdf.addImage(
    //         "https://scan-app-uploads.s3.eu-north-1.amazonaws.com/2+(1).jpg",
    //         "JPEG",
    //         xPosition,
    //         yPosition,
    //         newWidth,
    //         newHeight
    //     );
    //     // Yuqori matnlar
    //     pdf.setFont("times", "normal");
    //     pdf.setFontSize(16);
    //     pdf.text("Qashqadaryo viloyati Guzor tuman \"Buxoro qorako'l\"", (pageWidth - pdf.getTextWidth("Qashqadaryo viloyati G'uzor tuman 'Buxoro qorako'l'")) / 2, 80);
    //     pdf.text("xususiy maktabining savollar kitobi", (pageWidth - pdf.getTextWidth("xususiy maktabining savollar kitobi")) / 2, 88);

    //     pdf.setFontSize(12);
    //     pdf.text("Oliy ta'lim muassasalariga kiruvchilar uchun", (pageWidth - pdf.getTextWidth("Oliy ta'lim muassasalariga kiruvchilar uchun")) / 2, 100);
    //     pdf.text("Savollar kitobi", (pageWidth - pdf.getTextWidth("Savollar kitobi")) / 2, 107);

    //     pdf.text("5-sinflar", (pageWidth - pdf.getTextWidth("5-sinflar")) / 2, 130);
    //     pdf.text(`Savollar kitobi raqami: ${listId.toString().padStart(4, "0")}`, (pageWidth - pdf.getTextWidth(`Savollar kitobi raqami: ${listId.toString().padStart(4, "0")}`)) / 2, 136);

    //     // Jadvalni tayyorlash uchun ma'lumotlar
    //     const tableData = [];

    //     // Savollarni qayta ishlash
    //     questions.forEach((question) => {
    //         const { category, order, subject } = question;

    //         if (category.startsWith("Majburiy_fan")) {
    //             // Majburiy fanlar uchun 10 tadan bo‘lak
    //             const blockNumber = Math.ceil(order / 10);
    //             const rangeStart = (blockNumber - 1) * 10 + 1;
    //             const rangeEnd = blockNumber * 10;

    //             // Yagona qatorni yig'ish
    //             const existingRow = tableData.find((row) => row.category === "Majburiy_fan");
    //             if (existingRow) {
    //                 // Mavjud bo‘lsa, interval va mavzuni qo‘shish
    //                 existingRow.range = `${existingRow.range}, ${rangeStart}-${rangeEnd}`;
    //                 existingRow.subjects = `${existingRow.subjects}, ${subject}`;
    //             } else {
    //                 // Yangi qator qo‘shish
    //                 tableData.push({
    //                     range: `${rangeStart}-${rangeEnd}`,
    //                     subjects: subject,
    //                     category: "Majburiy_fan",
    //                 });
    //             }
    //         } else if (category === "Fan_1" || category === "Fan_2") {
    //             // Fan_1 va Fan_2 uchun 30 tadan bo‘lak
    //             const blockNumber = Math.ceil(order / 30);
    //             const rangeStart = (blockNumber - 1) * 30 + 1;
    //             const rangeEnd = blockNumber * 30;

    //             // Jadvalga qo'shish yoki mavjud qatorni yangilash
    //             const existingRow = tableData.find((row) => row.range === `${rangeStart}-${rangeEnd}`);
    //             if (existingRow) {
    //                 // Mavjud bo‘lsa, mavzuni qo‘shish
    //                 existingRow.subjects = `${existingRow.subjects}, ${subject}`;
    //             } else {
    //                 // Yangi qator qo‘shish
    //                 tableData.push({
    //                     range: `${rangeStart}-${rangeEnd}`,
    //                     subjects: subject,
    //                 });
    //             }
    //         }
    //     });

    //     // Majburiy_fan uchun kategoriyani olib tashlash
    //     tableData.forEach((row) => delete row.category);



    //     // Jadval ustunlari va ma'lumotlarni sozlash
    //     const columns = [
    //         { header: "Savollar soni", dataKey: "range" },
    //         { header: "Mavzular", dataKey: "subjects" },
    //     ];

    //     // Jadvalni chiziqlar bilan yaratish
    //     pdf.autoTable({
    //         columns: columns, // Ustunlarni belgilash
    //         body: tableData, // Jadval uchun ma'lumot
    //         startY: 150, // Jadvalni yuqoridan joylash
    //         // tableWidth: 'wrap', // Jadval ma'lumotga qarab o'lchami
    //         margin: { left: 50, right: 50 }, // Jadvalni markazlashtirib, eni kichrayadi
    //         theme: "plain", // Oddiy jadval uslubi
    //         columnStyles: {
    //             0: { cellWidth: 50 }, // 1-ustun kengligi
    //             1: { cellWidth: 70 }, // 2-ustun kengligi
    //         },
    //         styles: {
    //             halign: 'center', // Gorizontal o'rtaga
    //             valign: 'middle', // Vertikal o'rtaga
    //             fontSize: 10, // Matn shrift hajmi
    //             cellPadding: 2, // Hujayra ichidagi matn atrofidagi bo'shliq
    //             lineWidth: 0.1, // Chiziq qalinligi (ingichka chiziq)
    //             lineHeight: 2, // Qatorlar orasidagi masofani kamaytirish
    //             lineColor: [0, 0, 0], // Chiziq rangi qora
    //         },
    //         headStyles: {
    //             fillColor: [255, 255, 255], // Sarlavha fonini o‘zgartirish
    //             textColor: [0, 0, 0], // Sarlavha matn rangi
    //             lineWidth: 0.2, // Sarlavha chiziq qalinligi
    //             lineColor: [0, 0, 0], // Sarlavha chiziq rangi
    //         },
    //         bodyStyles: {
    //             lineWidth: 0.2, // Jadval tanasi chiziq qalinligi
    //             lineColor: [0, 0, 0], // Jadval tanasi chiziq rangi qora
    //         },
    //     });

    //     var text = "Test topshiruvchi: _________________________________________________   _________";
    //     var textWidth = pdf.getTextWidth(text);  // Matnning uzunligini hisoblaymiz
    //     var startX = (pageWidth - textWidth) / 2;  // Matnni o'rtaga joylashtirish uchun boshlanish nuqtasi
    //     pdf.text(text, startX, 210);  // Matnni o'rtada joylashtirish

    //     // Pastki yo'riqnoma matni
    //     const instructions = [
    //         "1. Test topshiriqlarini bajarish uchun berilgan vaqt 2 soat;",
    //         "2. Savollar kitobini o'zingiz bilan olib ketishingiz va o'z ustingizda ishlashingiz mumkin;",
    //         "3. Javoblar varaqasini e'tibor bilan bo'yashingiz shart;",
    //         "4. Test natijalari 5 ish kuni davomida e'lon qilinadi;",
    //         "5. Natijalar @bukhara_maktabi rasmiy botidan bilib olishingiz mumkin;",
    //     ];

    //     const totalHeight = instructions.length * lineHeight; // Matn balandligi
    //     let yPos = pageHeight - marginBottom - totalHeight; // Matnni pastki chegaraga joylashtirish uchun boshlang'ich pozitsiya

    //     // Yo'riqnoma sarlavhasini qo'shish
    //     pdf.setFont("times", "bold");
    //     pdf.setFontSize(13);
    //     pdf.text("Test bajaruvchi uchun yo'riqnoma:", (pageWidth - pdf.getTextWidth("Test bajaruvchi uchun yo'riqnoma:")) / 2, yPos);
    //     yPos += lineHeight;

    //     // Yo'riqnoma matnini qo'shish
    //     pdf.setFont("times", "bold");
    //     pdf.setFontSize(12);
    //     instructions.forEach((line) => {
    //         pdf.text(line, marginLeft, yPos);
    //         yPos += lineHeight; // Har bir qator uchun masofa
    //     });

    //     pdf.addPage(); // Keyingi sahifaga o'tish
    // };
    // // Chegara va sahifa raqamlarini qo'shish funksiyasi
    // const addBordersAndPageNumbers = (pdf) => {
    //     const totalPages = pdf.internal.getNumberOfPages(); // Umumiy sahifalar soni
    //     const pageWidth = pdf.internal.pageSize.getWidth();
    //     const pageHeight = pdf.internal.pageSize.getHeight();

    //     for (let i = 1; i <= totalPages; i++) {
    //         pdf.setPage(i);

    //         // Chegaralarni chizish
    //         pdf.setDrawColor(0, 0, 0);
    //         pdf.setLineWidth(0.5);
    //         pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    //         // Sahifa raqami qo'shish
    //         pdf.setFontSize(10);
    //         pdf.setTextColor(100);
    //         pdf.text(
    //             `Sahifa: ${i} / ${totalPages}`,
    //             pageWidth / 2,
    //             pageHeight - 5,
    //             { align: 'center' }
    //         );
    //     }
    // };
    // savollar yaratish
    // HTML ma'lumotlarni tozalash funksiyasi
    // const cleanHTML = (html) => {
    //     if (typeof html !== "string") {
    //         console.error("cleanHTML funksiyasiga noto'g'ri formatdagi ma'lumot uzatildi:", html);
    //         return ""; // Xatolik yuz berganda bo'sh string qaytaradi
    //     }

    //     const div = document.createElement("div");
    //     div.innerHTML = html;
    //     return div.textContent || div.innerText || "";
    // };

    // // Variantlarni formatlash funksiyasi
    // const formatOptions = (options) => {
    //     const cleaned = cleanHTML(options); // HTMLni tozalash
    //     const parts = cleaned.text.split(/[A-D]\)/); // 'A)', 'B)', 'C)', 'D)' bo'yicha ajratish
    //     return parts
    //         .map((opt) => opt.trim()) // Har bir elementni tozalash
    //         .filter((opt) => opt); // Bo'sh qiymatlarni olib tashlash
    // };

    // // // Rasmni Base64 formatga o‘tkazish
    // // const fetchImageAsBase64 = async (url) => {
    // //     const response = await fetch(url);
    // //     const blob = await response.blob();
    // //     return new Promise((resolve, reject) => {
    // //         const reader = new FileReader();
    // //         reader.onloadend = () => resolve(reader.result);
    // //         reader.onerror = reject;
    // //         reader.readAsDataURL(blob);
    // //     });
    // // };
    // const extractImageUrls = (html) => {
    //     if (typeof html !== "string") {
    //         console.error("extractImageUrls funksiyasiga noto'g'ri formatdagi ma'lumot uzatildi:", html);
    //         return []; 
    //     }

    //     const imageUrls = [];
    //     const div = document.createElement("div");
    //     div.innerHTML = html;

    //     const images = div.querySelectorAll("img");
    //     images.forEach((img) => {
    //         if (img.src) {
    //             imageUrls.push(img.src);
    //         }
    //     });

    //     return imageUrls;
    // };

    // const renderQuestions = async (item, pdf) => {
    //     const pdfDoc = new jsPDF();
    //     const pageWidth = pdfDoc.internal.pageSize.getWidth();
    //     const margin = 10; 
    //     const standardTextHeight = 12;

    //     // HTMLdan rasm URL'larini ajratib olish
    //     const extractImageUrls = (html) => {
    //         const parser = new DOMParser();
    //         const doc = parser.parseFromString(html, "text/html");
    //         const images = doc.querySelectorAll("img");
    //         return Array.from(images).map((img) => img.src);
    //     };

    //     for (const list of item.questions || []) {
    //         const questions = (list.questions || []).sort((a, b) => a.order - b.order);

    //         if (questions.length === 0) {
    //             continue;
    //         }

    //         pdfDoc.addPage();
    //         pdfDoc.text(`List ID: ${list.list_id}`, pageWidth / 2, margin, { align: "center" });

    //         let cursorY = margin + 20;
    //         let cursorX = margin;

    //         for (const question of questions) {
    //             let text = question.text;
    //             let options = question.options;

    //             const textImageUrls = extractImageUrls(text);
    //             const optionsImageUrls = extractImageUrls(options);

    //             let imageUrls = [...textImageUrls, ...optionsImageUrls];

    //             text = text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    //             options = options.replace(/<\/?[^>]+(>|$)/g, "").trim();

    //             const textParts = text.split("[IMAGE]");
    //             const optionsParts = options.split("[IMAGE]");

    //             let beforeText = textParts[0].trim();
    //             let afterText = textParts[1]?.trim() || "";

    //             const textWidth = pdfDoc.getTextWidth(beforeText);
    //             if (beforeText) {
    //                 pdfDoc.text(beforeText, cursorX, cursorY);
    //             }

    //             let imageX = cursorX + textWidth + 2;

    //             // Rasmni qo'shish
    //             for (const imageUrl of imageUrls) {
    //                 try {
    //                     // Rasmni axios orqali olish
    //                     const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

    //                     if (imageResponse.status === 200) {
    //                         const imageBlob = new Blob([imageResponse.data], { type: "image/png" });

    //                         const imgData = await new Promise((resolve, reject) => {
    //                             const reader = new FileReader();
    //                             reader.onloadend = () => resolve(reader.result); // Base64 formatida rasmni olish
    //                             reader.onerror = () => reject(new Error("Failed to read image"));
    //                             reader.readAsDataURL(imageBlob);
    //                         });

    //                         try {
    //                             pdfDoc.addImage(imgData, "png", imageX, cursorY, 12, 5);
    //                             cursorX = imageX + 20 + 2; // Keyingi rasm uchun joy ajratish
    //                         } catch (err) {
    //                             console.error(`Rasmni qo'shishda xatolik: ${err.message}`, imageUrl);
    //                         }
    //                     } else {
    //                         console.error("Rasmni olishda muammo:", imageUrl);
    //                     }
    //                 } catch (err) {
    //                     console.error(`Rasm yuklashda xatolik: ${err.message}`, imageUrl);
    //                 }
    //             }

    //             if (afterText) {
    //                 const afterTextX = cursorX + (imageUrls.length > 0 ? 22 : 0);

    //                 if (afterTextX > pageWidth - margin) {
    //                     cursorY += standardTextHeight;
    //                     cursorX = margin;
    //                     pdfDoc.text(afterText, cursorX, cursorY);
    //                 } else {
    //                     pdfDoc.text(afterText, afterTextX, cursorY);
    //                 }
    //             }

    //             cursorY += standardTextHeight + 5;
    //         }
    //     }

    //     addBordersAndPageNumbers(pdf);

    //     const pdfBlob = pdfDoc.output("blob");
    //     const pdfData = await pdfBlob.arrayBuffer();
    //     const pdfDataUri = await new Promise((resolve) => {
    //         const reader = new FileReader();
    //         reader.onloadend = () => resolve(reader.result);
    //         reader.readAsDataURL(new Blob([pdfData]));
    //     });

    //     pdf.addPage();
    //     pdf.addImage(pdfDataUri, "png", 0, 0, pageWidth, pdfDoc.internal.pageSize.height);
    // };
    // Matn boshidagi raqam va nuqtani olib tashlash funksiyasi
    // const removeNumberAndDot = (text) => {
    //     return text.replace(/^\d+\.\s*/, "");
    // };

    // HTML ni qayta ishlash uchun yordamchi funksiya

    // const processContent = (html) => {
    //     const parser = new DOMParser();
    //     const doc = parser.parseFromString(html, 'text/html');

    //     // Rasmlarni [IMAGE] markeri bilan almashtirish
    //     const images = doc.querySelectorAll('img');
    //     images.forEach(img => {
    //         const placeholder = doc.createTextNode('[IMAGE]');
    //         img.replaceWith(placeholder);
    //     });

    //     return doc.body.textContent.trim();
    // };

    // // Rasm URL manbalarini olish
    // const extractImageUrls = (html) => {
    //     const parser = new DOMParser();
    //     const doc = parser.parseFromString(html, 'text/html');
    //     return Array.from(doc.querySelectorAll('img')).map(img => img.src);
    // };

    // // Rasm o'lchamlarini hisoblash
    // const calculateImageSize = (imgProps, maxHeight) => {
    //     const ratio = imgProps.width / imgProps.height;
    //     return {
    //         width: maxHeight * ratio,
    //         height: maxHeight
    //     };
    // };

    // // Matnni '[IMAGE]' formatiga o'zgartirish
    // const processContentWithImages = (content, imageUrls) => {
    //     let processedContent = content;
    //     imageUrls.forEach((url, index) => {
    //         processedContent = processedContent.replace(url, '[IMAGE]');
    //     });
    //     return processedContent;
    // };

    // // Matn va rasmlarni joylashtirish
    // const addContentToPdf = async (pdfDoc, content, imageUrls, startX, startY, pageWidth, margin) => {
    //     let currentY = startY;
    //     const lineHeight = pdfDoc.getLineHeight() * pdfDoc.internal.getFontSize() / 72 * 25.4;
    //     const imageMaxWidth = 100; // Rasimning maksimal kengligi
    //     const imageMaxHeight = 60; // Rasimning maksimal balandligi
    //     const pageHeight = pdfDoc.internal.pageSize.getHeight();

    //     const parts = content.split('[IMAGE]');

    //     for (let i = 0; i < parts.length; i++) {
    //         const textPart = parts[i].trim();

    //         // Matnni joylashtirish
    //         if (textPart) {
    //             pdfDoc.setFontSize(12);
    //             const lines = pdfDoc.splitTextToSize(textPart, pageWidth - margin * 2);

    //             for (const line of lines) {
    //                 if (currentY + lineHeight > pageHeight - margin) {
    //                     pdfDoc.addPage();
    //                     currentY = margin;
    //                 }

    //                 pdfDoc.text(line, margin, currentY, { maxWidth: pageWidth - margin * 2 });
    //                 currentY += lineHeight;
    //             }
    //         }

    //         // Rasimni joylashtirish
    //         if (i < imageUrls.length) {
    //             try {
    //                 const imageResponse = await axios.get(imageUrls[i], { responseType: 'arraybuffer' });
    //                 const imgData = new Uint8Array(imageResponse.data);
    //                 const imgProps = pdfDoc.getImageProperties(imgData);
    //                 const scaleFactor = Math.min(
    //                     imageMaxWidth / imgProps.width,
    //                     imageMaxHeight / imgProps.height
    //                 );
    //                 const imgWidth = imgProps.width * scaleFactor;
    //                 const imgHeight = imgProps.height * scaleFactor;

    //                 if (currentY + imgHeight > pageHeight - margin) {
    //                     pdfDoc.addPage();
    //                     currentY = margin;
    //                 }

    //                 pdfDoc.addImage(imgData, 'PNG', startX, currentY, imgWidth, imgHeight);
    //                 currentY += imgHeight + 5;
    //             } catch (error) {
    //                 console.error('Rasim yuklashda xatolik:', error);
    //             }
    //         }
    //     }

    //     return currentY;
    // };

    // // Asosiy PDF generatsiya funksiyasi
    // const handleGeneratePdf = async () => {
    //     setLoading(true);
    //     setError(null);
    //     setSuccessMessage('');
    //     setProgress(0);

    //     try {
    //         const response = await axios.get(
    //             'https://scan-app-9206bf041b06.herokuapp.com/api/questions?question_filter=true'
    //         );

    //         if (response.status === 200) {
    //             const pdfDoc = new jsPDF({ format: 'a4' }); // A4 formatini o'rnatish
    //             const margin = 15;
    //             const pageWidth = pdfDoc.internal.pageSize.getWidth();
    //             let totalQuestions = 0;
    //             let processedQuestions = 0;

    //             // Font va asosiy sozlamalar
    //             pdfDoc.setFont('helvetica');
    //             pdfDoc.setFontSize(12);

    //             // Savollar sonini hisoblash
    //             response.data.forEach(list => {
    //                 totalQuestions += list.questions.length;
    //             });

    //             // Har bir list uchun ishlov
    //             for (const list of response.data) {
    //                 pdfDoc.addPage();
    //                 let cursorY = margin + 1;

    //                 // Sarlavha
    //                 pdfDoc.setFontSize(16);
    //                 pdfDoc.text(`List ID: ${list.list_id}`, margin, margin);

    //                 // Savollarni tartiblash
    //                 const sortedQuestions = list.questions.sort((a, b) => a.order - b.order);

    //                 // Har bir savol uchun ishlov
    //                 for (const question of sortedQuestions) {
    //                     const text = processContentWithImages(question.text, extractImageUrls(question.text));
    //                     const options = processContentWithImages(question.options, extractImageUrls(question.options));
    //                     const textImages = extractImageUrls(question.text);
    //                     const optionImages = extractImageUrls(question.options);

    //                     // Savol matnini va rasmlarini joylashtirish
    //                     cursorY = await addContentToPdf(
    //                         pdfDoc,
    //                         text,
    //                         textImages,
    //                         margin,
    //                         cursorY,
    //                         pageWidth,
    //                         margin
    //                     );

    //                     // Variantlarni joylashtirish
    //                     if (options) {
    //                         const optionParts = options.match(/([A-D]\))(.*?)(?=\s+[A-D]\)|$)/g) || [];

    //                         for (const part of optionParts) {
    //                             const [_, label, content] = part.match(/([A-D]\))(.*)/) || [];
    //                             const imageIndex = optionImages.findIndex(url => content.includes(url));

    //                             const processedContent = imageIndex >= 0
    //                                 ? content.replace(optionImages[imageIndex], '[IMAGE]')
    //                                 : content;

    //                             const images = imageIndex >= 0
    //                                 ? [optionImages[imageIndex]]
    //                                 : [];

    //                             cursorY = await addContentToPdf(
    //                                 pdfDoc,
    //                                 `${label}${processedContent}`,
    //                                 images,
    //                                 margin + 15, // Indentatsiya
    //                                 cursorY,
    //                                 pageWidth,
    //                                 margin
    //                             );

    //                             // Sahifadan oshib ketgan qismlarni yangi sahifaga tushirish
    //                             if (cursorY > pdfDoc.internal.pageSize.getHeight() - margin) {
    //                                 pdfDoc.addPage();
    //                                 cursorY = margin;
    //                             }
    //                         }
    //                     }

    //                     // Progress yangilash
    //                     processedQuestions++;
    //                     setProgress(Math.round((processedQuestions / totalQuestions) * 100));

    //                     // Yangi sahifa tekshiruvi
    //                     if (cursorY > pdfDoc.internal.pageSize.getHeight() - margin) {
    //                         pdfDoc.addPage();
    //                         cursorY = margin;
    //                     }
    //                 }
    //             }

    //             // PDFni saqlash
    //             pdfDoc.save('barcha-savollar.pdf');
    //             setSuccessMessage('PDF muvaffaqiyatli yaratildi!');
    //         }
    //     } catch (err) {
    //         console.error('Xatolik:', err);
    //         setError(err.message || 'PDF yaratishda xatolik yuz berdi');
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    // API orqali ma'lumotlarni olish
    // API orqali ma'lumotlarni olish
    useEffect(() => {
        fetch("https://scan-app-9206bf041b06.herokuapp.com/api/questions?question_filter=true") // O'zingizning API URL'ingizni qo'ying
            .then((response) => response.json())
            .then((data) => {
                if (data && data.length > 0) {
                    setQuestions(data[0].questions); // Ma'lumotlarni saqlash
                }
            })
            .catch((error) => console.error("API xatosi:", error)); // Xatolikni konsolda ko'rsatish
    }, []);

    // PDF yaratish funksiyasi
    const handleGeneratePdf = async () => {
        const pdf = new jsPDF();

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            // HTMLni dinamik yaratish
            const element = document.createElement("div");
            element.innerHTML = `
        <div style="padding: 10px; font-family: Arial, sans-serif; font-size: 12px;">
          <h3 style="color: #333;">Savol ${question.order}</h3>
          <div>${question.text || ""}</div>
          <div>${question.options || ""}</div>
        </div>
      `;

            // HTML'ni canvasga aylantirish
            const canvas = await html2canvas(element, {
                useCORS: true, // CORS muammolarini hal qilish uchun
                allowTaint: true, // Tashqi resurslarni yuklashga ruxsat
                logging: true, // Konsolda jarayonni kuzatish
                scale: 2, // Sifatni oshirish uchun
            });

            const imgData = canvas.toDataURL("image/png"); // Canvasni rasmga aylantirish

            // PDFga rasmni qo'shish
            if (i > 0) pdf.addPage(); // Har bir yangi savol uchun yangi sahifa qo'shish
            pdf.addImage(imgData, "PNG", 10, 10, 190, 0); // PDFga rasm qo'shish
        }

        pdf.save("questions.pdf"); // PDFni saqlash
    };



    useEffect(() => {
        // JavaScript to show/hide content for different tabs (optional for more complex logic)
        const pillsTab = new Tab(document.getElementById('pills-profile-tab'));
        pillsTab.show(); // Show the Result tab by default
    }, []);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setPage(1);
        setData({});
    };
    useEffect(() => {
        if (selectedDate) {
            fetchData(selectedDate, page);
        }
    }, [selectedDate, page]);

    const fetchData = useCallback(async (date) => {
        try {
            setLoading(true);
            setError(null);

            const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
            const response = await axios.get(
                `https://scan-app-9206bf041b06.herokuapp.com/api/questions?date=${formattedDate}&questions_only=true`
            );

            const newData = response.data?.results || []; // API'dan kelgan ma'lumotlar
            const groupedData = groupBy(newData);

            // Yangi ma'lumotlarni mavjud ma'lumotlarga qo'shish yoki yangilash, takrorlanishni tekshirish
            setData((prevData) => {
                const updatedData = { ...prevData };
                Object.keys(groupedData).forEach((key) => {
                    if (updatedData[key]) {
                        const existingIds = new Set(updatedData[key].map(item => item.list_id));
                        const filteredGroup = groupedData[key].filter(item => !existingIds.has(item.list_id));
                        updatedData[key] = [...updatedData[key], ...filteredGroup];
                    } else {
                        updatedData[key] = groupedData[key];
                    }
                });
                return updatedData;
            });

        } catch (err) {
            console.error("Xatolik yuz berdi:", err);
            setError("Ma'lumotni yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    }, []);

    const groupBy = (items) => {
        if (!Array.isArray(items)) {
            throw new Error("Invalid items array.");
        }
        return items.reduce((result, item) => {
            if (!item.question_class || !item.categories || !item.subjects) {
                return result;
            }
            const groupKey = `${item.question_class}-${item.categories.join(",")}-${item.subjects.join(",")}`;
            (result[groupKey] = result[groupKey] || []).push(item);
            return result;
        }, {});
    };


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
                                        <option value="Matematika">Matematika</option>
                                        <option value="Ona_tili">Ona tili</option>
                                        <option value="Ingliz_tili">Ingliz tili</option>
                                        <option value="Biologiya">Biologiya</option>
                                        <option value="Tarix">Tarix</option>
                                        <option value="Huquq">Huquq</option>
                                        <option value="Fizika">Fizika</option>
                                        <option value="Kimyo">Kimyo</option>
                                        <option value="Algebra">Algebra</option>
                                        <option value="Geometriya">Geometriya</option>

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
                            <button
                                type="submit"
                                className={`btn btn-primary btn-sm w-auto mx-5 ${isLoading ? "disabled" : ""}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                            aria-hidden="true"
                                            style={{ marginRight: "8px" }}
                                        ></span>
                                        Yuklanmoqda...
                                    </>
                                ) : (
                                    "Yuborish"
                                )}
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
                {/* <div className="tab-pane fade" id="pills-contact" role="tabpanel" aria-labelledby="pills-contact-tab">
                    <div className="container mt-4">
                        <div className="row">
                            <div className="container mt-5">
                                <h3>Dashboard</h3>
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    dateFormat="yyyy-MM-dd"
                                    className="form-control"
                                />
                                <button
                                    onClick={handleGeneratePdf}
                                    disabled={loading}
                                >
                                    {loading ? 'Yuklanmoqda...' : 'PDF Yaratish'}
                                </button>

                                {error && <div className="error">{error}</div>}
                                {successMessage && <div className="success">{successMessage}</div>}

                                {loading && (
                                    <div className="progress">
                                        <progress value={progress} max="100" />
                                        <span>{progress}% tugallandi</span>
                                    </div>
                                )}

                                {loading ? (
                                    <p>Yuklanmoqda...</p>
                                ) : error ? (
                                    <p className="text-danger">{error}</p>
                                ) : Object.keys(data).length > 0 ? (
                                    <div className="row mt-4">
                                        {Object.keys(data).map((groupKey, index) => (
                                            <div className="col-md-4 mb-4" key={index}>
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h5>Sinf: {data[groupKey][0]?.question_class}</h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <p><strong>Kategoriyalar:</strong> {data[groupKey][0]?.categories?.join(", ")}</p>
                                                        <p><strong>Fanlar:</strong> {data[groupKey][0]?.subjects?.join(", ")}</p>
                                                        <p><strong>Savollar soni:</strong> {data[groupKey].length}</p>
                                                        <button
                                                            className="btn btn-primary mt-3"
                                                            onClick={() => handleGeneratePdf(groupKey, selectedDate)} // to'g'ri argumentlar yuboriladi
                                                            disabled={isLoading} // Yuklash davomida tugma faolsiz bo'ladi
                                                        >
                                                            {isLoading ? "Yuklanmoqda..." : "Savollarni Yuklab Olish"}
                                                        </button>

                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Hech qanday ma'lumot topilmadi</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>

    );
}

export default Dashboard;
