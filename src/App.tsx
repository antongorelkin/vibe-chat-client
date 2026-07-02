import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// Убедись, что IP-адрес твоего компьютера указан верно (или localhost, если тестишь на ПК)
const socket = io("http://192.168.1.87:3001");

interface MessageData {
	text: string;
	senderId: number;
	time: string;
	sender_name?: string;
}

interface UserInfo {
	id: number;
	username: string;
}

const emojiMap: { [key: string]: string } = {
	":)": "😊",
	":(": "😢",
	"<3": "❤️",
	":fire:": "🔥",
	":ok:": "👌",
	";)": "😉",
};

export default function App() {
	const [usernameInput, setUsernameInput] = useState("");
	const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
	const [activeChatId, setActiveChatId] = useState<number | null>(null);
	const [message, setMessage] = useState("");
	const [chatHistory, setChatHistory] = useState<MessageData[]>([]);
	const [_usersList, setUsersList] = useState<UserInfo[]>([]);
	const [_activeChatPartner, setActiveChatPartner] = useState<string | null>(
		null,
	);

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		socket.on("user_authorized", (data: UserInfo) => {
			setCurrentUser(data);
		});

		socket.on("users_list", (list: UserInfo[]) => {
			setUsersList(list);
		});

		socket.on("chat_ready", ({ chatId }) => {
			setActiveChatId(chatId);
			setChatHistory([]);
			socket.emit("join_room", { chatId });
		});

		socket.on("room_history", (history: any[]) => {
			const formatted = history.map((msg) => ({
				text: msg.text,
				senderId: msg.sender_id,
				time: new Date(msg.created_at).toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				}),
				sender_name: msg.sender_name,
			}));
			setChatHistory(formatted);
		});

		socket.on("receive_private_message", (data: any) => {
			setChatHistory((prev) => [...prev, data]);
		});

		return () => {
			socket.off("user_authorized");
			socket.off("users_list");
			socket.off("chat_ready");
			socket.off("room_history");
			socket.off("receive_private_message");
		};
	}, []);

	useEffect(() => {
		if (currentUser) {
			socket.emit("get_users", { currentUserId: currentUser.id });
		}
	}, [currentUser]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chatHistory]);

	const handleLogin = () => {
		if (!usernameInput.trim()) return;
		socket.emit("user_login", usernameInput.trim());
	};

	const startPrivateChat = (partner: UserInfo) => {
		if (!currentUser) return;
		setActiveChatPartner(partner.username);
		socket.emit("get_or_create_chat", {
			user1: currentUser.id,
			user2: partner.id,
		});
	};

	const handleInputChange = (text: string) => {
		let updatedText = text;
		Object.keys(emojiMap).forEach((shortcut) => {
			updatedText = updatedText.replaceAll(shortcut, emojiMap[shortcut]);
		});
		setMessage(updatedText);
	};

	const sendMessage = () => {
		if (!message.trim() || !activeChatId || !currentUser) return;
		socket.emit("send_private_message", {
			chatId: activeChatId,
			senderId: currentUser.id,
			text: message.trim(),
		});
		setMessage("");
	};
	// Окно авторизации (если пользователь еще не ввел ник)
	if (!currentUser) {
		return (
			<div className="flex h-screen bg-[#0b0f19] justify-center items-center p-4 text-slate-100">
				<div className="w-full max-w-sm bg-[#111827] p-8 rounded-3xl border border-slate-800 shadow-2xl text-center">
					<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white">
						V
					</div>
					<h2 className="text-xl font-bold mb-1">Настройка Виджета</h2>
					<p className="text-xs text-slate-400 mb-4">
						Введите имя тестового клиента для сайта
					</p>
					<input
						type="text"
						value={usernameInput}
						onChange={(e) => setUsernameInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleLogin()}
						placeholder="Имя клиента (например, Анна)..."
						className="w-full bg-[#1f2937] border border-slate-800 rounded-xl px-4 py-3 text-sm text-center mb-4 focus:outline-none focus:border-indigo-500"
					/>
					<button
						onClick={handleLogin}
						className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-3 rounded-xl transition-all">
						Запустить виджет
					</button>
				</div>
			</div>
		);
	}

	// СОБСТВЕННО КЛИЕНТСКИЙ ИИ-ВИДЖЕТ ДЛЯ САЙТА
	return (
		<>
			{/* ФОН-ЗАГЛУШКА: Имитируем реальный сайт клиента (автосервис, клиника и т.д.) */}
			<div className="w-screen h-screen bg-[#0b0f19] p-8 flex flex-col justify-center items-center text-center antialiased">
				<h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-2">
					Сайт Вашего Клиента
				</h1>
				<p className="text-sm text-slate-500 max-w-md leading-relaxed">
					Это демонстрационный экран. Наш ИИ-виджет уже успешно подключен к
					этому сайту одной строчкой скрипта и скромно ждет в правом нижнем углу
					экрана! 🎯
				</p>
			</div>

			{/* КОРНЕВОЙ КОНТЕЙНЕР ВИДЖЕТА: Фиксирован в правом нижнем углу экрана */}
			<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans antialiased select-none">
				{/* ВССПЛЫВАЮЩЕЕ ОКНО ЧАТА ПОДДЕРЖКИ (Отображается только если activeChatId не пустой) */}
				{activeChatId && (
					<div className="w-[360px] h-[500px] sm:w-[380px] sm:h-[550px] bg-[#111827] rounded-3xl border border-slate-800/80 shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 transform scale-100 origin-bottom-right">
						{/* Шапка чата виджета */}
						<div className="p-4 bg-gradient-to-r from-[#1f2937]/80 to-[#111827] border-b border-slate-800 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-indigo-500/20">
									🤖
								</div>
								<div>
									<h3 className="font-semibold text-xs tracking-wide text-slate-100">
										ИИ-Консультант
									</h3>
									<p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>{" "}
										Онлайн 24/7
									</p>
								</div>
							</div>

							{/* Кнопка закрытия крестиком */}
							<button
								onClick={() => {
									setActiveChatId(null);
									setActiveChatPartner(null);
								}}
								className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors text-xs">
								✕
							</button>
						</div>

						{/* Лента сообщений виджета */}
						<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d1321]/40">
							{chatHistory.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-slate-500 text-[11px] text-center px-4 leading-loose uppercase tracking-wider">
									🤖 Здравствуйте! <br /> Задайте мне любой вопрос по услугам
									или прайсу компании!
								</div>
							) : (
								chatHistory.map((msg, index) => (
									<div
										key={index}
										className={`flex flex-col max-w-[85%] ${msg.senderId === currentUser.id ? "ml-auto items-end" : "mr-auto items-start"}`}>
										<div
											className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
												msg.senderId === currentUser.id
													? "bg-indigo-600 text-white rounded-br-none"
													: "bg-[#1f2937] text-slate-200 rounded-bl-none border border-slate-800/60"
											}`}>
											{msg.text}
										</div>
										<span className="text-[9px] text-slate-500 mt-1 px-1 opacity-70">
											{msg.time}
										</span>
									</div>
								))
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Поле ввода сообщения виджета */}
						<div className="p-3 bg-[#111827] border-t border-slate-800 flex items-center gap-2">
							<input
								type="text"
								value={message}
								onChange={(e) => handleInputChange(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && sendMessage()}
								placeholder="Напишите ваш вопрос..."
								className="flex-1 bg-[#1f2937] border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
							/>
							<button
								onClick={sendMessage}
								className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-600/10">
								Отправить
							</button>
						</div>
					</div>
				)}

				{/* КРУГЛАЯ КНОПКА-ИКОНКА ВИДЖЕТА В УГЛУ ЭКРАНА */}
				<button
					onClick={() => {
						if (activeChatId) {
							setActiveChatId(null);
							setActiveChatPartner(null);
						} else {
							// Автоматически инициируем чат с Ботом под ID 999 при клике на иконку
							startPrivateChat({ id: 999, username: "Бот-Ассистент 🤖" });
						}
					}}
					className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all duration-200 relative group group-hover:rotate-12"
					title="Чат поддержки">
					{activeChatId ? "✕" : "💬"}

					{/* Световой индикатор поверх кнопки */}
					{!activeChatId && (
						<span className="absolute top-0 right-0 w-3,5 h-3,5 bg-emerald-500 border-2 border-[#0b0f19] rounded-full"></span>
					)}
				</button>
			</div>
		</>
	);
}
