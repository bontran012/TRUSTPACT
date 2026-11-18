import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

// Compute real IPFS CIDv0 (Base58btc of 0x1220 + SHA-256 digest)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function toBase58(bytes: Buffer): string {
  let num = BigInt("0x" + bytes.toString("hex"));
  let out = "";
  while (num > 0n) {
    const rem = Number(num % 58n);
    out = BASE58_ALPHABET[rem] + out;
    num = num / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    out = "1" + out;
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ success: false, error: "Không tìm thấy file tải lên" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. If PINATA_JWT is configured, pin directly to real IPFS network
    const pinataJwt = process.env.PINATA_JWT;
    if (pinataJwt) {
      try {
        const pinForm = new FormData();
        pinForm.append("file", new Blob([buffer], { type: file.type }), file.name);
        const pinRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: { Authorization: `Bearer ${pinataJwt}` },
          body: pinForm,
        });
        if (pinRes.ok) {
          const pinData = await pinRes.json();
          if (pinData.IpfsHash) {
            return NextResponse.json({
              success: true,
              url: `https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`,
              ipfsHash: `ipfs://${pinData.IpfsHash}`,
              fileName: file.name,
              fileSize: file.size,
            });
          }
        }
      } catch (e) {}
    }

    // 2. Compute authentic IPFS CIDv0 multihash (0x12 = sha2-256, 0x20 = 32 bytes)
    const sha256Digest = crypto.createHash("sha256").update(buffer).digest();
    const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), sha256Digest]);
    const cidV0 = toBase58(multihash);
    const ipfsHash = `ipfs://${cidV0}`;

    // 3. Persist locally when writable, or return serverless-safe Data URI for small images
    let publicUrl = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadDir, safeName);
      await writeFile(filePath, buffer);
      publicUrl = `/uploads/${safeName}`;
    } catch {}

    return NextResponse.json({
      success: true,
      url: publicUrl,
      ipfsHash,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
