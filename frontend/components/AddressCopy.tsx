import React, { useState } from "react";

import { Copy, Check, ExternalLink } from "lucide-react";



interface AddressCopyProps {

  address: string;

  truncateLength?: number;

  showExplorerLink?: boolean;

  className?: string;

  badgeLabel?: string;

}



export function AddressCopy({

  address,

  truncateLength = 4,

  showExplorerLink = true,

  className = "",

  badgeLabel,

}: AddressCopyProps) {

  const [copied, setCopied] = useState(false);



  const displayAddress =

    address.length > truncateLength * 2 + 2

      ? `${address.slice(0, truncateLength + 2)}...${address.slice(-truncateLength)}`

      : address;



  const handleCopy = (e: React.MouseEvent) => {

    e.stopPropagation();

    if (typeof window !== "undefined") {

      navigator.clipboard.writeText(address);

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);

    }

  };



  const explorerUrl = `https://testnet.snowtrace.io/address/${address}`;



  return (

    <div className={`inline-flex items-center space-x-1 text-xs font-mono ${className}`}>

      {badgeLabel && (

        <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-slate-400 text-[10px] uppercase font-sans font-semibold">

          {badgeLabel}

        </span>

      )}



      <div className="inline-flex items-center rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] transition-all overflow-hidden">

        <button

          type="button"

          onClick={handleCopy}

          title="Sao chép địa chỉ ví"

          className="group inline-flex items-center space-x-1.5 px-2 py-0.5 text-slate-300 hover:text-white transition-colors"

        >

          <span className="tabular-nums">{displayAddress}</span>

          {copied ? (

            <Check className="w-3 h-3 text-emerald-400" />

          ) : (

            <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />

          )}

        </button>



        {showExplorerLink && (

          <a

            href={explorerUrl}

            target="_blank"

            rel="noopener noreferrer"

            title="Mở trên Snowtrace Explorer"

            onClick={(e) => e.stopPropagation()}

            className="px-1.5 py-0.5 border-l border-white/[0.06] text-slate-500 hover:text-blue-400 hover:bg-white/[0.03] transition-colors"

          >

            <ExternalLink className="w-3 h-3" />

          </a>

        )}

      </div>

    </div>

  );

}
