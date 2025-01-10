import React, { useState, useEffect } from "react";
import fontkit from '@pdf-lib/fontkit';
import axios from "axios";
import { Page, Text, View, Document, pdf, PDFDownloadLink, StyleSheet } from "@react-pdf/renderer";
import { PDFDocument, rgb } from 'pdf-lib';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import './dashboard.css';

function Dashboard() {
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false); // Loading holatini qo'shish
    const [data, setData] = useState([]);
    const [groupedData, setGroupedData] = useState({});
    const [selectedDates, setSelectedDates] = useState([]);
    const [forms, setForms] = useState([
        { file: null, category: "", subject: "" }
    ]);
    const handleAddForm = () => {
        if (forms.length < 5) {
            setForms([...forms, { file: null, category: "", subject: "" }]);
        } else {
            alert("Siz maksimal 5 ta fayl yubora olasiz!");
        }
    };

    const handleChange = (index, field, value) => {
        const newForms = [...forms];
        newForms[index][field] = value;
        setForms(newForms);
    };

    const handleFileChange = (index, file) => {
        const newForms = [...forms];
        newForms[index].file = file;
        setForms(newForms);
    };

    const handleRemoveFileField = (index) => {
        const newForms = forms.filter((_, i) => i !== index);
        setForms(newForms);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Yuklanishni boshlash

        try {
            // Har bir formni ketma-ket yuklash
            for (let form of forms) {
                if (!form.file || !form.category || !form.subject) {
                    alert("Iltimos, barcha maydonlarni to‘ldiring va faylni tanlang.");
                    setLoading(false);
                    return;
                }

                const formData = new FormData();
                formData.append("files", form.file);
                formData.append("categories", form.category);
                formData.append("subjects", form.subject);

                await axios.post("https://create-test-app-100ceac94608.herokuapp.com/upload/", formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                });
            }

            alert("Hamma ma'lumotlar muvaffaqiyatli yuborildi!");

            const value = prompt("Nechta savol kerakligini kiriting:");

            if (!value) {
                alert("Savollar soni kiritilmagan.");
                setLoading(false);
                return;
            }

            try {
                const questionsResponse = await axios.get(
                    "https://create-test-app-100ceac94608.herokuapp.com/questions/"
                );
                const questionsData = questionsResponse.data;

                const finalData = [
                    {
                        num: { additional_value: parseInt(value, 10) },
                        data: questionsData.data,
                    },
                ];
                console.log("Final Data Structure:", JSON.stringify(finalData, null, 2));
                await axios.post(
                    "https://scan-app-a3872b370d3e.herokuapp.com/api/questions",
                    finalData,
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );

                alert("Savollar muvaffaqiyatli yuborildi!");
                // Savollarni o'chirish
                await fetch("https://create-test-app-100ceac94608.herokuapp.com/delete-all-questions/", { method: "DELETE" });
            } catch (error) {
                console.error("Savollarni yuborishda xatolik yuz berdi:", error);
                alert(`Savollarni yuborishda xatolik: ${error.response?.data?.detail || error.message}`);
            }

        } catch (error) {
            console.error("Xatolik yuz berdi:", error);
            alert(`Fayllarni yuborishda xatolik: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false); // Yuklanishni tugatish
        }
    };

    // Fetch API data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("http://scan-app-a3872b370d3e.herokuapp.com/api/questions");
                if (!response.ok) throw new Error("API fetch error");
                const json = await response.json();

                // Format dates and group data
                const formattedData = json.map((item) => ({
                    ...item,
                    formattedDate: new Date(item.created_at).toISOString().split("T")[0],
                }));

                const grouped = formattedData.reduce((acc, item) => {
                    if (!acc[item.formattedDate]) acc[item.formattedDate] = [];
                    acc[item.formattedDate].push(item);
                    return acc;
                }, {});

                setData(formattedData);
                setGroupedData(grouped);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    // Toggle selected dates
    const handleDateSelection = (date) => {
        setSelectedDates((prevDates) =>
            prevDates.includes(date) ? prevDates.filter((d) => d !== date) : [...prevDates, date]
        );
    };

    // Create PDF
    async function createPDF(list) {
        const pdfDoc = await PDFDocument.create();

        // Add a font (you can embed a custom font here if needed)
        const font = await pdfDoc.embedFont(PDFDocument.PDFStandardFonts.Helvetica);

        // Set up page size
        const pageWidth = 595.28; // A4 page width
        const pageHeight = 841.89; // A4 page height
        const margin = 50;

        // Iterate through each category
        for (const { category, items } of data) {
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            const fontSize = 12;

            let x = margin;
            let y = pageHeight - margin;

            // Add the category header
            y -= fontSize * 2; // Leave some space for the header
            page.drawText(category, {
                x: margin,
                y: y,
                size: fontSize + 4,
                font,
                color: rgb(0, 0, 1), // Blue header
            });

            y -= fontSize * 2; // Space between header and content

            // Render items in two columns
            const columnWidth = (pageWidth - margin * 2) / 2;
            let column = 0; // Track current column

            for (const item of items) {
                page.drawText(`- ${item}`, {
                    x: margin + column * columnWidth,
                    y: y,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0), // Black text
                });

                y -= fontSize + 5; // Move down for the next item

                // Check if the current column needs to switch
                if (y < margin) {
                    column += 1; // Switch to next column
                    y = pageHeight - margin * 4; // Reset Y for the new column
                }

                // If both columns are full, add a new page
                if (column > 1) {
                    column = 0; // Reset column
                    y = pageHeight - margin; // Reset Y for the new page
                }
            }
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    // Download selected as ZIP
    const handleDownloadSelectedAsZip = async () => {
        try {
            const zip = new JSZip();

            for (const date of selectedDates) {
                const lists = groupedData[date];
                if (Array.isArray(lists) && lists.length > 0) {
                    for (const list of lists) {
                        const pdfBlob = await createPDF(list);
                        const fileName = `List_${list.list_id}.pdf`;
                        zip.file(`${date}/${fileName}`, pdfBlob);
                    }
                } else {
                    console.warn(`No data found for date: ${date}`);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "selected_data.zip");
        } catch (error) {
            console.error("Error creating ZIP:", error);
        }
    };


    return (
        <div className="flex-container">
            <div className="container">
                <div>
                    <header>
                        <h1>Ma'lumotlarni yuklash</h1>
                    </header>
                    {/* Ma'lumotlarni sanalar bo‘yicha ko‘rsatish */}
                    {Object.keys(groupedData).map((date) => (
                        <div key={date} style={{ marginBottom: "10px" }}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedDates.includes(date)}
                                    onChange={() => handleDateSelection(date)}
                                />
                                {date} ({groupedData[date].length} ta hujjat)
                            </label>
                        </div>
                    ))}

                    {/* Tanlanganlarni yuklash tugmasi */}
                    <button
                        onClick={handleDownloadSelectedAsZip}
                        disabled={selectedDates.length === 0}
                    >
                        {selectedDates.length === 0
                            ? "Sanani tanlang"
                            : "Tanlanganlarni ZIP qilib yuklash"}
                    </button>
                </div>
            </div>

            <div className="container">
                <header>
                    <h1>Fayl yuborish</h1>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="file-fields-container">
                        {forms.map((form, index) => (
                            <div key={index} className="file-fields" style={{ marginBottom: "20px" }}>
                                <label htmlFor={`fileInput${index}`}>Fayl {index + 1}:</label>
                                <input
                                    type="file"
                                    id={`fileInput${index}`}
                                    name="file"
                                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                                    required
                                />
                                <label htmlFor={`categorySelect${index}`}>Kategoriya:</label>
                                <select
                                    id={`categorySelect${index}`}
                                    name="category"
                                    value={form.category}
                                    onChange={(e) => handleChange(index, "category", e.target.value)}
                                    required
                                >
                                    <option value="">Kategoriya tanlang</option>
                                    <option value="Majburiy_Fan_1">Majburiy_Fan_1</option>
                                    <option value="Majburiy_Fan_2">Majburiy_Fan_2</option>
                                    <option value="Majburiy_Fan_3">Majburiy_Fan_3</option>
                                    <option value="Fan_1">Fan_1</option>
                                    <option value="Fan_2">Fan_2</option>
                                </select>
                                <label htmlFor={`subjectSelect${index}`}>Mavzu:</label>
                                <select
                                    id={`subjectSelect${index}`}
                                    name="subject"
                                    value={form.subject}
                                    onChange={(e) => handleChange(index, "subject", e.target.value)}
                                    required
                                >
                                    <option value="">Mavzu tanlang</option>
                                    <option value="Algebra">Algebra</option>
                                    <option value="Matematika">Matematika</option>
                                    <option value="Geometriya">Geometriya</option>
                                    <option value="Kimyo">Kimyo</option>
                                    <option value="Fizika">Fizika</option>
                                    <option value="Ona tili">Ona tili</option>
                                </select>
                                <button
                                    type="button"
                                    className="remove-file-btn"
                                    onClick={() => handleRemoveFileField(index)}
                                >
                                    -
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="button-container">
                        {forms.length < 5 && (
                            <button type="button" onClick={handleAddForm} disabled={loading}>
                                + Fayl qo'shish
                            </button>
                        )}
                        <button type="submit" disabled={loading}>
                            {loading ? "Yuklanmoqda..." : "Savollarni yuborish"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Dashboard;
