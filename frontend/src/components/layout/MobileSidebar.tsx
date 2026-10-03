import { X } from "lucide-react";
import Sidebar from "./Sidebar";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close navigation"
      />

      <div className="relative flex h-full w-72 max-w-[85vw]">
        <Sidebar />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

export default MobileSidebar;