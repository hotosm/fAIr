import { GuageIcon, LoopIcon, TimerIcon } from '@/components/ui/icons';
import styles from './core-features.module.css'
import { IconProps } from '@/utils/types';


type TCoreFeatures = {
    title: string
    icon: React.FC<IconProps>
}
const coreFeatures: TCoreFeatures[] = [
    {
        title: 'Time Efficient',
        icon: TimerIcon
    }, {
        title: 'High Accuracy',
        icon: GuageIcon
    }, {
        title: 'Time Efficient',
        icon: LoopIcon
    }
]

const CoreFeatures = () => {
    return (
        <div className={styles.coreFeature}>
            {
                coreFeatures.map(
                    (feature, id) => <div
                        className='flex flex-col items-center gap-y-6'
                        key={`core-feature-${id}`}>
                        <div className='w-16 h-16 rounded-full p-4 bg-white flex items-center justify-center shadow-lg'>
                            <feature.icon className='w-10 h-10 text-primary' />
                        </div>
                        <h3 className='text-dark font-semibold text-[20px]'>{feature.title}</h3>
                    </div>
                )
            }
        </div>
    )
}

export default CoreFeatures;