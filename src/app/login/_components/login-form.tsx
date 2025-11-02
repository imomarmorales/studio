
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { QrCode } from "lucide-react";
import { signInWithCustomToken } from "firebase/auth";

// The "QR Code" is just the user's UID. This schema validates that it's not empty.
const formSchema = z.object({
  qrData: z.string().min(10, { message: "El código de la credencial no es válido." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qrData: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    
    const uid = values.qrData;

    toast({
      title: "Procesando credencial...",
      description: "Validando tu identidad.",
    });

    try {
        // This is a placeholder for a secure custom token validation
        // For this passwordless flow, we assume the UID from the QR is valid
        // and sign the user in. A robust implementation would involve a server
        // validating the UID against a database before creating a custom token.
        
        // Since we are using anonymous auth, we can't just "log in" as another
        // user. We would need a custom token. For this demo, we'll simulate
        // the effect by redirecting to the dashboard, assuming a real app
        // would handle custom token exchange here.
        
        if (auth.currentUser?.uid === uid) {
          toast({
            title: "Sesión ya iniciada",
            description: "Ya has iniciado sesión con esta credencial."
          });
          router.push("/dashboard");
          return;
        }

        // In a real app, you would:
        // 1. Send the `uid` to your backend.
        // 2. Your backend verifies it's a valid user.
        // 3. Your backend uses the Firebase Admin SDK to create a custom token: `admin.auth().createCustomToken(uid)`
        // 4. Your backend sends the custom token back to the client.
        // 5. The client signs in with the token: `signInWithCustomToken(auth, customToken)`
        
        // For this prototype, we'll show a message and redirect.
        toast({
            title: "Inicio de Sesión Simulado",
            description: "Redirigiendo al dashboard. La autenticación real en un nuevo dispositivo requiere un backend."
        });

      // We are just navigating, not truly authenticating as the scanned user.
      router.push("/dashboard");

    } catch (error: any)
{
      console.error("Error al iniciar sesión con QR:", error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "La credencial no es válida o no se pudo autenticar. Inténtalo de nuevo.",
      });
    }
  }

  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl pt-4">Iniciar Sesión</CardTitle>
          <CardDescription>
            Pega el código de tu credencial digital para acceder en un nuevo dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="qrData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Credencial Digital</FormLabel>
                    <FormControl>
                      <Input placeholder="Pega el código aquí..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Acceder
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="underline text-primary">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
