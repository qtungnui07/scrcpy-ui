import React from "react";
import { useAppStore } from "../../stores/appStore";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

export const NotificationToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-black shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-black shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#BA1A1A] shrink-0" />,
    info: <Info className="w-5 h-5 text-black shrink-0" />,
  };

  const bgStyles = {
    success: "bg-[#87F96E]",
    warning: "bg-[#FFD027]",
    error: "bg-[#FFDAD6] text-[#BA1A1A]",
    info: "bg-[#85C1E9]",
  };

  return (
    <div className="fixed bottom-14 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_#000000] text-black",
            bgStyles[notif.type]
          )}
        >
          {icons[notif.type]}
          <div className="flex-1 min-w-0">
            {notif.title && (
              <h4 className="text-xs font-black uppercase tracking-wider mb-0.5">
                {notif.title}
              </h4>
            )}
            <p className="text-xs font-bold leading-snug break-words">
              {notif.message}
            </p>
          </div>
          <button
            onClick={() => removeNotification(notif.id)}
            className="p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      ))}
    </div>
  );
};
