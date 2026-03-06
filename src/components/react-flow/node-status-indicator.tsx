import { type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type NodeStatus = "loading" | "success" | "error" | "initial";

export type NodeStatusVariant = "overlay" | "border";

export type NodeStatusIndicatorProps = {
  status?: NodeStatus;
  variant?: NodeStatusVariant;
  children: ReactNode;
  className?: string;
};

export const SpinnerLoadingIndicator = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div className="relative">
      <StatusBorder className="border-blue-600/50">{children}</StatusBorder>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-blue-600" />
      </div>
    </div>
  );
};

export const BorderLoadingIndicator = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div className="absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)]">
        <style>
          {`
          @keyframes border-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .node-border-spinner {
            animation: border-spin 1.8s linear infinite;
            width: 200%;
            height: 200%;
            position: absolute;
            top: -50%;
            left: -50%;
            background: conic-gradient(
              from 0deg,
              rgba(59,130,246,0.7),
              rgba(59,130,246,0.15),
              rgba(59,130,246,0.7)
            );
          }
        `}
        </style>

        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-md",
            className
          )}
        >
          <div className="node-border-spinner" />
        </div>
      </div>
      {children}
    </>
  );
};

const StatusBorder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div
        className={cn(
          "absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-md border-2",
          className
        )}
      />
      {children}
    </>
  );
};

export const NodeStatusIndicator = ({
  status,
  variant = "border",
  children,
  className,
}: NodeStatusIndicatorProps) => {
  switch (status) {
    case "loading":
      switch (variant) {
        case "overlay":
          return <SpinnerLoadingIndicator>{children}</SpinnerLoadingIndicator>;
        case "border":
          return (
            <BorderLoadingIndicator className={className}>
              {children}
            </BorderLoadingIndicator>
          );
        default:
          return <>{children}</>;
      }

    case "success":
      return (
        <StatusBorder className={cn("border-green-600", className)}>
          {children}
        </StatusBorder>
      );

    case "error":
      return (
        <StatusBorder className={cn("border-red-600", className)}>
          {children}
        </StatusBorder>
      );

    default:
      return <>{children}</>;
  }
};