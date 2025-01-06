import React, { useState } from "react";
import './dashboard.css'
const Dashboard = () => {
    const [fileFields, setFileFields] = useState([]);
    const [additionalValue, setAdditionalValue] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Fayl qo'shish funksiyasi
    const addFileField = () => {
        if (fileFields.length >= 5) {
            alert("Fayllarni maksimal 5 ta yuborishingiz mumkin.");
            return;
        }

        const newFileField = {
            id: fileFields.length + 1,
            category: "",
            subject: "",
            file: null,
        };

        setFileFields([...fileFields, newFileField]);
    };

    // Faylni olib tashlash funksiyasi
    const removeFileField = (id) => {
        setFileFields(fileFields.filter((field) => field.id !== id));
    };

    // Fayl inputlarini yangilash
    const handleFileChange = (id, field, value) => {
        setFileFields(
            fileFields.map((fileField) =>
                fileField.id === id ? { ...fileField, [field]: value } : fileField
            )
        );
    };

    // Formani yuborish
    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();

        // Fayllarni FormData ga qo'shish
        fileFields.forEach((fileField) => {
            if (fileField.file) {
                formData.append("files", fileField.file);
                formData.append("category", fileField.category);
                formData.append("subject", fileField.subject);
            }
        });

        const token = localStorage.getItem("jwt_token");

        if (!token) {
            alert("JWT token topilmadi!");
            return;
        }

        try {
            // Fayllarni yuklash
            const uploadResponse = await fetch("https://create-test-app-100ceac94608.herokuapp.com/upload/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Fayllarni yuborishda xatolik yuz berdi.");
            }

            // Qo'shimcha savollar sonini olish
            const value = prompt("Nechta savol kerakligini kiriting:");
            if (!value) {
                alert("Savollar soni kiritilmagan.");
                return;
            }
            setAdditionalValue(value);

            const response = await fetch("https://create-test-app-100ceac94608.herokuapp.com/questions/");
            if (!response.ok) throw new Error("Savollarni olishda xatolik yuz berdi.");
            const data = await response.json();

            // Formatlash
            const finalData = [
                {
                    num: {
                        additional_value: parseInt(value),
                    },
                    data: {},
                },
            ];

            // Har bir categoryni to'liq formatga kiritish
            Object.entries(data.data).forEach(([category, items]) => {
                // Agar kategoriya hali mavjud bo'lmasa, uni massiv sifatida yarating
                if (!finalData[0].data[category]) {
                    finalData[0].data[category] = [];
                }

                // Kategoriya massiviga savollarni qo'shish
                items.forEach(item => {
                    finalData[0].data[category].push({
                        category: item.category,
                        subject: item.subject,
                        text: item.text,
                        options: item.options,
                        true_answer: item.true_answer,
                        image: item.image || null,
                    });
                });
            });
            // Final data ni konsolga chiqarish
            console.log(JSON.stringify(finalData, null, 2));

            // Savollarni yuborish
            const postResponse = await fetch("https://scan-app-a3872b370d3e.herokuapp.com/api/questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(finalData),
            });

            if (!postResponse.ok) throw new Error("POST so'rovi muvaffaqiyatsiz bo'ldi.");
            alert("Savollar muvaffaqiyatli yuborildi!");

            // Savollarni o'chirish
            await fetch("https://create-test-app-100ceac94608.herokuapp.com/delete-all-questions/", { method: "DELETE" });
        }
        catch (error) {
            setErrorMessage(error.message);
            alert("Xatolik yuz berdi: " + error.message);
        }
    };

    // Data yuklash
    const handleGetData = async () => {
        const apiUrl = "https://response-app-f961b14d1345.herokuapp.com/download-zip/";

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("API so'rovi bajarilmadi");
            }

            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "file.zip";
            link.click();
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="flex-container">
            <div className="container">
                <header>
                    <h1>Savollarni yuklash</h1>
                </header>
                <div className="button-container">
                    <button onClick={handleGetData}>Yuklash</button>
                </div>
                <div className="response-data">
                    {errorMessage && <pre>{`Xatolik: ${errorMessage}`}</pre>}
                </div>
            </div>

            <div className="container">
                <header>
                    <h1>Fayl yuborish</h1>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="file-fields-container">
                        {fileFields.map((fileField) => (
                            <div key={fileField.id} className="file-fields">
                                <label htmlFor={`fileInput${fileField.id}`}>Fayl {fileField.id}:</label>
                                <input
                                    type="file"
                                    id={`fileInput${fileField.id}`}
                                    name="files"
                                    accept=".zip"
                                    onChange={(e) => handleFileChange(fileField.id, "file", e.target.files[0])}
                                    required
                                />
                                <label htmlFor={`categorySelect${fileField.id}`}>Kategoriya:</label>
                                <select
                                    id={`categorySelect${fileField.id}`}
                                    name="category"
                                    value={fileField.category}
                                    onChange={(e) => handleFileChange(fileField.id, "category", e.target.value)}
                                    required
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
                                >
                                    <option value="">Mavzu tanlang</option>
                                    <option value="Algebra">Algebra</option>
                                    <option value="Geometriya">Geometriya</option>
                                    <option value="Kimyo">Kimyo</option>
                                    <option value="Fizika">Fizika</option>
                                    <option value="Ona tili">Ona tili</option>
                                </select>
                                <button type="button" className="remove-file-btn" onClick={() => removeFileField(fileField.id)}>
                                    -
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="button-container">
                        <button type="button" onClick={addFileField}>
                            + Fayl qo'shish
                        </button>
                        <button type="submit">So'rov yuborish</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;
