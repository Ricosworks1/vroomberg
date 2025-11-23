export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">
            Rock Research AI
          </h1>
          <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Advanced blockchain payment flow analysis powered by cutting-edge research and AI.
            Get personalized insights into your DeFi portfolio.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#news"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Latest Research
            </a>
            <a
              href="#request-report"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition border border-blue-500"
            >
              Request Analysis
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
