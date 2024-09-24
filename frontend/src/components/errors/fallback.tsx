import { Button } from '@/components/ui/button'
import { APP_CONTENT } from '@/utils';

const MainErrorFallback = () => {
    return (
        <section className="min-h-[80vh] flex flex-col mt-20 items-center justify-around">
            <div>
                <p className="text-[20px] lg:text-[38px] font-semibold text-dark text-center">
                    {APP_CONTENT.errorBoundary.title}
                </p>
            </div>

            <Button variant="primary" onClick={() => window.location.assign(window.location.origin)}
                className="max-w-[300px]"
            >
                {APP_CONTENT.errorBoundary.button}
            </Button>
        </section>
    );
};

export default MainErrorFallback