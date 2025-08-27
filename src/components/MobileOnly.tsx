
import { DumbbellIcon } from "@/components/Icons";

const MobileOnly: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-white to-indigo-100 text-gray-800">
    <div className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-lg bg-white/80 border border-pink-200">
      <DumbbellIcon className="w-12 h-12 text-pink-600" />
      <h1 className="text-3xl font-bold text-pink-700">Trackle</h1>
      <h2 className="text-xl font-semibold text-indigo-700">Mobile Only</h2>
      <p className="text-base text-center max-w-xs">
        This website is designed for mobile devices.<br />
        Please access it from your phone or tablet for the best experience.
      </p>
    </div>
  </div>
);

export default MobileOnly;
