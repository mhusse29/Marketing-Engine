import AuthCard from "../components/auth/AuthCard";

export default function AuthPageSimple() {
	return (
		<div className="relative min-h-screen w-full overflow-hidden bg-black">
			{/* Simple gradient background instead of 3D shader */}
			<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
					<div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
					<div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
				</div>
			</div>

			{/* Radial Gradient Overlay */}
			<div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_50%,_transparent_30%,_black_100%)]" />

			{/* Auth Card Container */}
			<div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 md:px-6">
				<div className="w-full max-w-md">
					<AuthCard />
				</div>
			</div>

			{/* Back to App Link */}
			<div className="absolute top-6 left-6 z-20">
				<a
					href="/"
					className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 group"
				>
					<svg
						className="w-4 h-4 transition-transform group-hover:-translate-x-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					<span className="text-sm font-medium">Back to App</span>
				</a>
			</div>
		</div>
	);
}
