"use client";
import { useEffect, useRef, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowUpRight } from "lucide-react";
const Intercepted = createContext(false);
export function InterceptedProfile({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Intercepted.Provider value={true}>{children}</Intercepted.Provider>;
}
export function ProfilePanel({
  children,
  name,
  id,
}: {
  children: React.ReactNode;
  name: string;
  id: string;
}) {
  const intercepted = useContext(Intercepted);
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const close = () => (intercepted ? router.back() : router.push("/creators"));
  return (
    <dialog
      ref={dialog}
      className="creator-profile-dialog"
      aria-label={name + " creator profile"}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="profile-panel-toolbar">
        <button
          className="icon-button"
          aria-label="Close creator profile"
          onClick={close}
        >
          <X size={22} />
        </button>
        <a
          href={"/creators/" + id + "?view=page"}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          View in a new tab <ArrowUpRight size={14} />
        </a>
      </div>
      {children}
    </dialog>
  );
}
