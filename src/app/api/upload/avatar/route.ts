import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type FormidableFile = {
  filepath: string;
  originalFilename?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const form = new formidable.IncomingForm();

  form.parse(
    req,
    async (
      err: Error | null,
      fields: Record<string, unknown>,
      files: Record<string, FormidableFile | FormidableFile[]>
    ) => {
      if (err) {
        console.error("Erreur parsing formulaire:", err);
        return res.status(500).json({ error: "Erreur réception fichier" });
      }

      const file = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
      const userId = fields.userId as string;
      const scale = parseFloat(fields.scale as string) || 1;

      if (!file) return res.status(400).json({ error: "Fichier avatar invalide" });
      if (!userId) return res.status(400).json({ error: "userId manquant" });

      try {
        const fileContent = fs.readFileSync(file.filepath);
        const ext = (file.originalFilename ?? "png").split(".").pop();
        const filePath = `avatars/${userId}/avatar_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, fileContent, { upsert: true });

        if (uploadError || !uploadData) {
          console.error("Erreur upload Supabase:", uploadError);
          return res.status(500).json({ error: "Erreur upload" });
        }

const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

if (!publicUrlData?.publicUrl) {
  return res.status(500).json({ error: "URL publique introuvable" });
}


        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrlData.publicUrl, avatar_scale: scale })
          .eq("id", userId)
          .select();

        if (updateError) {
          console.error("Erreur update profil:", updateError);
          return res.status(500).json({ error: "Erreur update profil" });
        }

        return res.status(200).json({ avatar_url: publicUrlData.publicUrl, profile: updateData });
      } catch (error) {
        console.error("Erreur API:", error);
        return res.status(500).json({ error: "Erreur serveur" });
      }
    }
  );
}
