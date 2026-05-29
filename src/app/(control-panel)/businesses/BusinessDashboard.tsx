import Typography from '@mui/material/Typography';
import { Grid } from '@mui/material';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { motion } from 'motion/react';

function BusinessDashboard() {
	const container = {
		show: {
			transition: {
				staggerChildren: 0.1
			}
		}
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 }
	};

	return (
		<Box className="p-24 w-full max-w-7xl mx-auto">
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Typography variant="h4" className="font-extrabold tracking-tight mb-8">
					Business Dashboard
				</Typography>
				<Typography variant="subtitle1" color="text.secondary" className="mb-24">
					Welcome back! Here is an overview of your business operations.
				</Typography>
			</motion.div>

			<motion.div
				variants={container}
				initial="hidden"
				animate="show"
			>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 4 }}>
						<motion.div variants={item}>
							<Paper className="p-24 flex flex-col items-center justify-center min-h-160 shadow-lg border border-divider rounded-2xl bg-gradient-to-br from-background to-action-hover">
								<Typography variant="h6" color="primary" className="font-bold">Total Projects</Typography>
								<Typography variant="h2" className="font-black mt-8">12</Typography>
							</Paper>
						</motion.div>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<motion.div variants={item}>
							<Paper className="p-24 flex flex-col items-center justify-center min-h-160 shadow-lg border border-divider rounded-2xl bg-gradient-to-br from-background to-action-hover">
								<Typography variant="h6" color="secondary" className="font-bold">Active Users</Typography>
								<Typography variant="h2" className="font-black mt-8">45</Typography>
							</Paper>
						</motion.div>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<motion.div variants={item}>
							<Paper className="p-24 flex flex-col items-center justify-center min-h-160 shadow-lg border border-divider rounded-2xl bg-gradient-to-br from-background to-action-hover">
								<Typography variant="h6" color="success.main" className="font-bold">Revenue (MTD)</Typography>
								<Typography variant="h2" className="font-black mt-8">$12,400</Typography>
							</Paper>
						</motion.div>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<motion.div variants={item}>
							<Paper className="p-32 shadow-xl border border-divider rounded-2xl">
								<Typography variant="h5" className="font-bold mb-16">Business Insights</Typography>
								<Typography variant="body1" color="text.secondary">
									Your business is performing 15% better than last month. 
									Consider upgrading your plan to access advanced analytics and reporting tools.
								</Typography>
							</Paper>
						</motion.div>
					</Grid>
				</Grid>
			</motion.div>
		</Box>
	);
}

export default BusinessDashboard;
