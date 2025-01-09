import React, { useState } from "react";
import axios from "axios";
import './dashboard.css';

function Dashboard() {
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false); // Loading holatini qo'shish
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

    const handleGetData = async () => {
        setLoading(true);
        const apiUrl = "https://scan-app-a3872b370d3e.herokuapp.com/download-zip/";

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
        } finally {
            setLoading(false); // Yuklanishni tugatish
        }
    };

    return (
        <div className="flex-container">
            <div className="container">
                <header>
                    <h1>Savollarni yuklash</h1>
                </header>
                <div className="button-container">
                    <button onClick={handleGetData} disabled={loading}>
                        {loading ? "Yuklanmoqda..." : "Savollarni olish"}
                    </button>
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
