import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://vibe-chat-server-spag.onrender.com");

interface MessageData {
	text: string;
	sender: "me" | "other";
	time: string;
}

export default function App() {
	const [message, setMessage] = useState("");
	const [chatHistory, setChatHistory] = useState<MessageData[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		socket.on("receive_message", (text: string) => {
			setChatHistory((prev) => [
				...prev,
				{ text, sender: "other", time: getCurrentTime() },
			]);
		});

		return () => {
			socket.off("receive_message");
		};
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chatHistory]);

	const getCurrentTime = () => {
		return new Date().toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const emojiMap: { [key: string]: string } = {
		":)": "😊",
		":(": "😢",
		"<3": "❤️",
		":fire:": "🔥",
		":ok:": "👌",
		";)": "😉",
		":D": "😁",
		"B)": "😎",
		n_n: "✨",
	};

	const handleInputChange = (text: string) => {
		let updatedText = text;

		Object.keys(emojiMap).forEach((shortcut) => {
			updatedText = updatedText.replaceAll(shortcut, emojiMap[shortcut]);
		});

		setMessage(updatedText);
	};

	const sendMessage = () => {
		if (!message.trim()) return;

		socket.emit("send_message", message);
		setChatHistory((prev) => [
			...prev,
			{ text: message, sender: "me", time: getCurrentTime() },
		]);
		setMessage("");
	};

	return (
		<div className="flex h-screen bg-[#0b0f19] text-slate-100 justify-center items-center p-4">
			{/* Контейнер чата */}
			<div className="w-full max-w-md h-[85vh] bg-[#111827] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
				{/* Шапка чата */}
				<div className="p-4 bg-[#1f2937]/50 border-b border-slate-800 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
							V
						</div>
						<div>
							<h3 className="font-semibold text-sm tracking-wide">
								VibeChat Room
							</h3>
							<p className="text-xs text-emerald-400 flex items-center gap-1.5">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
								online
							</p>
						</div>
					</div>
				</div>

				{/* Окно сообщений */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
					{chatHistory.length === 0 ? (
						<div className="h-full flex items-center justify-center text-slate-500 text-xs tracking-wider uppercase">
							Нет сообщений. Начните диалог...
						</div>
					) : (
						chatHistory.map((msg, index) => (
							<div
								key={index}
								className={`flex flex-col max-w-[75%] ${
									msg.sender === "me"
										? "ml-auto items-end"
										: "mr-auto items-start"
								}`}>
								<div
									className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
										msg.sender === "me"
											? "bg-indigo-600 text-white rounded-br-none"
											: "bg-[#1f2937] text-slate-200 rounded-bl-none border border-slate-800"
									}`}>
									{msg.text}
								</div>
								<span className="text-[10px] text-slate-500 mt-1 px-1">
									{msg.time}
								</span>
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Зона ввода */}
				<div className="p-4 bg-[#1f2937]/30 border-t border-slate-800 flex items-center gap-2">
					<input
						type="text"
						value={message}
						onChange={(e) => handleInputChange(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && sendMessage()}
						placeholder="Сообщение..."
						className="flex-1 bg-[#1f2937] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
					/>
					<button
						onClick={sendMessage}
						className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-600/10">
						Отправить
					</button>
				</div>
			</div>
		</div>
	);
}
