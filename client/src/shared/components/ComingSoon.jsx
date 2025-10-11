import React from "react";
import { Clock } from "lucide-react";

const ComingSoon = ({ title = "Coming Soon" }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 mb-6 bg-wa-brand rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-wa-text-primary-light dark:text-wa-text-primary-dark mb-4">
          {title}
        </h1>

        <p className="text-wa-text-secondary-light dark:text-wa-text-secondary-dark text-lg">
          This feature is under development. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
