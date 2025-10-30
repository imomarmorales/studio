
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInAnonymously } from "firebase/auth";
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
      description: "Iniciando sesión.",
    });

    try {
        // This is a placeholder for a secure custom token validation
        // For this passwordless flow, we assume the UID from the QR is valid
        // and sign the user in. A robust implementation would involve a server
        // validating the UID against a database before creating a custom token.
        
        // Since we are creating anonymous users, we need to sign out any *current*
        // anonymous user before we can "sign in" as the new user.
        // A full custom token flow would handle this more gracefully.
        if (auth.currentUser) {
            await auth.signOut();
        }

        // We can't *actually* sign in as another user with just their UID on the client.
        // This simulates the intended behavior. The user is already "logged in"
        // anonymously from the registration step. Logging out and trying to log
        // back in with this flow won't work without a secure custom token backend.
        
        // For demonstration, we'll just redirect.
        toast({
            title: "Inicio de Sesión Simulado",
            description: "Redirigiendo al dashboard. El inicio de sesión real requiere un backend."
        });

      // We are just navigating, not truly authenticating as the scanned user.
      router.push("/dashboard");

    } catch (error: any) {
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
          <CardTitle className="font-headline text-2xl pt-4">Iniciar Sesión con QR</CardTitle>
          <CardDescription>
            Pega el contenido de tu credencial digital para acceder.
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
