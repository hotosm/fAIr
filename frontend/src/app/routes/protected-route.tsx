import { ShieldIcon } from "@/components/ui/icons";
import { useAuth } from "../providers/auth-provider"
import { APP_CONTENT } from "@/utils";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/use-login";
import { Head } from "@/components/seo";



type ProtectedRouteProps = {
    children: React.ReactNode
}

export const ProtectedPage: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, } = useAuth();
    const handleLogin = useLogin();

    if (!isAuthenticated) {
        return (
            <>
                <Head title="Authentication Required" />
                <section className="min-h-[80vh] flex flex-col mt-20 items-center justify-center gap-y-10">
                    <div className="flex flex-col items-center justify-center gap-y-10">
                        <div className="bg-gray-disabled w-[97px] h-[97px] flex items-center justify-center rounded-full p-2">
                            <ShieldIcon className="w-14 h-14" />
                        </div>
                        <div className="flex flex-col gap-y-10">
                            <h1 className="text-[20px] lg:text-[38px] font-semibold text-dark text-center">
                                {APP_CONTENT.protectedPage.messageTitle}
                            </h1>
                            <p className="text-[16px] lg:text-[18px] text-dark text-center">
                                {APP_CONTENT.protectedPage.messageParagraph}
                            </p>
                        </div>
                    </div>
                    <Button variant="primary" onClick={handleLogin}
                        className="max-w-[300px]"
                    >
                        {APP_CONTENT.protectedPage.ctaButton}
                    </Button>
                </section>
            </>
        )
    }
    return children
}