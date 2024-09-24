import { useState } from "react"
import { Button } from "../button";
import { APPLICATION_ROUTES } from "@/utils/constants";
import { Link } from "@/components/ui/link";
import { APP_CONTENT } from "@/utils/content";


const CookieConsentBanner = () => {

    const [showBanner, setShowBanner] = useState(true);

    const onClose = () => {
        setShowBanner(false);
    }
    return (
        <>
            {showBanner ? <div className="bottom-0 fixed min-h-[255px] bg-dark w-full px-4 lg:px-20">
                <div className="flex flex-col text-center py-4 lg:py-10 text-white gap-y-6 lg:px-4">
                    <h1 className="text-[16px] lg:text-xl font-semibold">{APP_CONTENT.cookieConsentBanner.heading}</h1>
                    <p className="text-sm lg:text-lg">{APP_CONTENT.cookieConsentBanner.paragraph.firstSection}
                        <Link href={APPLICATION_ROUTES.PRIVACY_POLICY} title="Privacy Policy" className="!text-primary !lowercase mx-1">
                            {APP_CONTENT.cookieConsentBanner.paragraph.privacyPolicy}
                        </Link>.
                        {APP_CONTENT.cookieConsentBanner.paragraph.lastSection}
                    </p>
                    <div className="flex flex-col gap-y-6 lg:flex-row justify-center items-center lg:gap-x-10 lg:max-w-md w-full mx-auto">
                        <Button onClick={onClose} variant="primary" className="max-w-[192px]">
                            {APP_CONTENT.cookieConsentBanner.buttons.agree}
                        </Button>
                        <Button onClick={onClose} variant="primary" className="max-w-[192px]">
                            {APP_CONTENT.cookieConsentBanner.buttons.disagree}
                        </Button>
                    </div>
                </div>
            </div> : null}
        </>

    )
}

export default CookieConsentBanner